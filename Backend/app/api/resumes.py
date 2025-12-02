"""
Resume upload and analysis endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import logging
import time
from pathlib import Path
import uuid

from app.core.database import get_db
from app.api.dependencies import verify_file_upload
from app.schemas.resume import ResumeAnalysisResponse, ResumeProcessingError
from app.models.candidate import Candidate
from app.models.skill import Skill, CandidateSkill
from app.utils.text_extraction import extract_text_from_file
from app.services.resume_parser import get_resume_parser
from app.services.skill_extractor import get_skill_extractor
from app.services.market_data import get_market_data_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post(
    "/upload",
    response_model=ResumeAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and analyze resume",
    description="Upload a resume file (PDF, DOCX, TXT) and extract skills with market intelligence"
)
async def upload_resume(
    file: UploadFile = File(..., description="Resume file to upload"),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and analyze resume file
    
    1. Extracts text from file
    2. Parses personal information
    3. Extracts skills using NER + Dictionary matching
    4. Enriches skills with market data
    5. Saves to database
    6. Returns comprehensive analysis
    
    **Supported formats:** PDF, DOCX, DOC, TXT
    **Max file size:** 5MB
    """
    start_time = time.time()
    resume_id = str(uuid.uuid4())
    
    logger.info(f"📄 Resume upload started: {file.filename} ({file.content_type})")
    
    try:
        # Validate file
        file_extension = Path(file.filename).suffix
        file_content = await file.read()
        file_size = len(file_content)
        
        await verify_file_upload(file_size, file_extension)
        
        # Step 1: Extract text
        logger.info("📝 Extracting text from file...")
        text, char_count, word_count = extract_text_from_file(file_content, file_extension)
        
        if char_count < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume appears to be too short or empty"
            )
        
        # Step 2: Parse resume information
        logger.info("👤 Parsing candidate information...")
        parser = get_resume_parser()
        candidate_info = parser.parse_resume(text)
        
        # Step 3: Extract skills
        logger.info("🔍 Extracting skills...")
        extractor = get_skill_extractor()
        extracted_skills, extraction_methods = extractor.extract_skills(text)
        
        if not extracted_skills:
            logger.warning("⚠️ No skills found in resume")
        
        # Step 4: Create or get candidate
        logger.info("💾 Saving candidate to database...")
        
        # For now, use a dummy user_id (will be replaced with Supabase auth)
        dummy_user_id = uuid.uuid4()
        
        # Check if candidate exists by email
        candidate = None
        if candidate_info['email']:
            result = await db.execute(
                select(Candidate).where(Candidate.email == candidate_info['email'])
            )
            candidate = result.scalar_one_or_none()
        
        if not candidate:
            # Create new candidate
            candidate = Candidate(
                user_id=dummy_user_id,
                name=candidate_info['name'],
                email=candidate_info['email'],
                phone=candidate_info['phone'],
                location=candidate_info['location']
            )
            db.add(candidate)
            await db.flush()  # Get candidate.id without committing
            logger.info(f"✅ Created new candidate: ID={candidate.id}")
        else:
            # Update existing candidate
            candidate.name = candidate_info['name']
            candidate.phone = candidate_info.get('phone') or candidate.phone
            candidate.location = candidate_info.get('location') or candidate.location
            logger.info(f"✅ Updated existing candidate: ID={candidate.id}")
        
        # Step 5: Process and save skills
        logger.info("💡 Processing skills with market data...")
        market_service = get_market_data_service()
        
        detailed_skills = []
        categorized_skills = {}
        all_skill_names = []
        
        for skill_data in extracted_skills:
            skill_name = skill_data['name']
            
            # Get or create skill
            result = await db.execute(
                select(Skill).where(Skill.name == skill_name)
            )
            skill = result.scalar_one_or_none()
            
            if not skill:
                # Create new skill
                skill = Skill(
                    name=skill_name,
                    category=skill_data['category'],
                    description=f"Skill: {skill_name}"
                )
                db.add(skill)
                await db.flush()
            
            # Calculate proficiency
            proficiency = extractor.calculate_proficiency(
                skill_name,
                text,
                skill_data.get('match_count', 1)
            )
            
            # Get market data
            market_demand = market_service.get_market_demand(skill_name)
            trend = market_service.get_trend(skill_name)
            trend_percentage = market_service.get_trend_percentage(skill_name)
            
            # Create or update candidate skill
            result = await db.execute(
                select(CandidateSkill).where(
                    CandidateSkill.candidate_id == candidate.id,
                    CandidateSkill.skill_id == skill.id
                )
            )
            candidate_skill = result.scalar_one_or_none()
            
            if not candidate_skill:
                candidate_skill = CandidateSkill(
                    candidate_id=candidate.id,
                    skill_id=skill.id,
                    proficiency=proficiency,
                    confidence=skill_data['confidence'],
                    extraction_method=skill_data['extraction_method']
                )
                db.add(candidate_skill)
            else:
                # Update existing
                candidate_skill.proficiency = proficiency
                candidate_skill.confidence = skill_data['confidence']
                candidate_skill.extraction_method = skill_data['extraction_method']
            
            # Build detailed response
            detailed_skills.append({
                "id": skill.id,
                "name": skill_name,
                "category": skill_data['category'],
                "proficiency": proficiency,
                "confidence": skill_data['confidence'],
                "years_of_experience": None,
                "extraction_method": skill_data['extraction_method']
            })
            
            all_skill_names.append(skill_name)
            
            # Categorize
            if skill_data['category'] not in categorized_skills:
                categorized_skills[skill_data['category']] = []
            categorized_skills[skill_data['category']].append(skill_name)
        
        # Commit all changes
        await db.commit()
        
        # Step 6: Calculate skill gaps (simplified for Day 1)
        total_skills = len(detailed_skills)
        coverage_percentage = min((total_skills / 20) * 100, 100)  # Assume 20 skills is full coverage
        
        # Step 7: Get course recommendations (placeholder for Day 2)
        recommendations = []  # Will implement course search on Day 2
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        logger.info(f"✅ Resume analysis complete: {total_skills} skills extracted in {processing_time_ms}ms")
        
        # Return comprehensive response
        return ResumeAnalysisResponse(
            success=True,
            candidate_id=candidate.id,
            resume_id=resume_id,
            name=candidate.name,
            email=candidate.email,
            phone=candidate.phone,
            location=candidate.location,
            skills={
                "total": total_skills,
                "all_skills": all_skill_names,
                "detailed": detailed_skills,
                "categorized": categorized_skills,
                "extraction_methods": extraction_methods
            },
            skill_gaps={
                "coverage": coverage_percentage,
                "missing_count": max(0, 20 - total_skills),
                "priority_gaps": []  # Will populate on Day 2
            },
            recommendations=recommendations,
            metadata={
                "file_char_count": char_count,
                "file_word_count": word_count,
                "processing_time_ms": processing_time_ms,
                "method": extraction_methods,
                "file_format": file_extension
            }
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"❌ Resume processing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume processing failed: {str(e)}"
        )

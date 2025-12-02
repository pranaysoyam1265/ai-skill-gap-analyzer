"""
Generate historical trend data for skills based on current market demand data
"""
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import math
import os


def load_market_data(file_path: str) -> List[Dict[str, Any]]:
    """Load current market demand data from JSON file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['skills']


def generate_seasonal_factor(month: int) -> float:
    """Generate seasonal hiring patterns (higher in Jan/Sep, lower in Dec)"""
    # January: +3% (new year hiring)
    # September: +2% (post-summer hiring)
    # December: -4% (holiday slowdown)
    # Summer months: slight increase
    
    seasonal_factors = {
        1: 1.03,   # January - new year hiring
        2: 1.01,   # February - slight increase
        3: 1.02,   # March - spring hiring
        4: 1.01,   # April - steady
        5: 1.015,  # May - slight increase
        6: 1.02,   # June - summer hiring starts
        7: 1.015,  # July - summer
        8: 1.01,   # August - slight
        9: 1.02,   # September - back to work hiring
        10: 1.015, # October - fall hiring
        11: 1.01,  # November - steady
        12: 0.96   # December - holiday slowdown
    }
    return seasonal_factors.get(month, 1.0)


def generate_historical_score(
    current_score: int, 
    trend: str, 
    month_offset: int,
    total_months: int = 12
) -> int:
    """Generate historical demand score based on trend and time"""
    
    # Base calculations
    if trend == "up":
        # Skills trending up start lower and increase
        start_offset = random.randint(8, 15)
        base_score = max(0, current_score - start_offset)
        
        # Calculate total increase needed
        total_increase = current_score - base_score
        # Add some random fluctuation around the trend
        base_increase = total_increase / total_months
        monthly_increase = base_increase + random.uniform(0.5, 1.5)
        
        # Progress from start to current
        progress = (total_months - month_offset) / total_months
        raw_score = base_score + (monthly_increase * (total_months - month_offset))
        
    elif trend == "down":
        # Skills trending down start higher and decrease
        start_offset = random.randint(8, 15)
        base_score = min(100, current_score + start_offset)
        
        # Calculate total decrease needed
        total_decrease = base_score - current_score
        base_decrease = total_decrease / total_months
        monthly_decrease = base_decrease + random.uniform(0.5, 1.5)
        
        # Progress from start to current
        raw_score = base_score - (monthly_decrease * (total_months - month_offset))
        
    else:  # stable
        # Skills staying stable have small random fluctuations around current
        base_score = current_score + random.uniform(-5, 5)
        
        # Small random changes each month
        monthly_variation = random.uniform(-2, 2)
        months_elapsed = total_months - month_offset
        
        # Apply accumulated variations with some damping
        total_variation = 0
        for i in range(int(months_elapsed)):
            variation = monthly_variation * random.uniform(0.3, 1.0)
            total_variation += variation
        
        raw_score = base_score + total_variation
    
    # Apply seasonal effects
    current_month = 12 - month_offset  # 0 for most recent, 11 for oldest
    seasonal_factor = generate_seasonal_factor(current_month + 1)  # +1 for 1-based month
    
    # Apply seasonal adjustment
    seasonal_score = raw_score * seasonal_factor
    
    # Add monthly noise (±2 points)
    noise = random.uniform(-2, 2)
    final_score = seasonal_score + noise
    
    # Ensure score is within bounds
    final_score = max(0, min(100, final_score))
    
    # Round to nearest integer
    return round(final_score)


def generate_trends_for_skill(skill_data: Dict[str, Any], months: int = 12) -> List[Dict[str, Any]]:
    """Generate historical trend data for a single skill"""
    skill_name = skill_data['name']
    current_score = skill_data['demand_score']
    trend = skill_data['trend']
    
    trends = []
    
    # Generate data for the last 'months' months
    current_date = datetime(2025, 11, 1)  # Current month anchor
    
    for i in range(months):
        # Calculate the month (0 = current month, 11 = 12 months ago)
        month_date = current_date - timedelta(days=30 * i)
        
        # Format month as YYYY-MM-01
        month_str = month_date.strftime('%Y-%m-01')
        
        # Generate score for this month
        score = generate_historical_score(current_score, trend, i, months)
        
        trends.append({
            "skill_name": skill_name,
            "month": month_str,
            "demand_score": score
        })
    
    return trends


def generate_all_trends(market_data_file: str, output_file: str, months: int = 12):
    """Generate historical trend data for all skills"""
    
    print(f"Loading market data from {market_data_file}...")
    market_data = load_market_data(market_data_file)
    
    print(f"Generating {months} months of trend data for {len(market_data)} skills...")
    
    all_trends = []
    
    # Generate trends for each skill
    for i, skill in enumerate(market_data):
        trends = generate_trends_for_skill(skill, months)
        all_trends.extend(trends)
        
        # Progress indicator
        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{len(market_data)} skills...")
    
    # Create output structure
    output_data = {
        "generated_at": datetime.now().isoformat(),
        "total_skills": len(market_data),
        "months_of_data": months,
        "total_records": len(all_trends),
        "trends": all_trends
    }
    
    # Write to file
    print(f"Writing {len(all_trends)} trend records to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated {len(all_trends)} trend records for {len(market_data)} skills")
    print(f"📁 Saved to: {output_file}")
    
    # Print some statistics
    trends_by_skill = {}
    for trend in all_trends:
        skill = trend['skill_name']
        if skill not in trends_by_skill:
            trends_by_skill[skill] = []
        trends_by_skill[skill].append(trend['demand_score'])
    
    print("\n📊 Sample trends for popular skills:")
    sample_skills = ["Python", "JavaScript", "React", "TypeScript", "Go"]
    for skill in sample_skills:
        if skill in trends_by_skill:
            scores = trends_by_skill[skill]
            current_score = scores[-1]  # Most recent score
            oldest_score = scores[0]    # Oldest score
            change = current_score - oldest_score
            print(f"  {skill}: {oldest_score} → {current_score} ({change:+d})")


if __name__ == "__main__":
    # Set random seed for reproducible results
    random.seed(42)
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Generate trends - use relative paths from script location
    market_data_file = os.path.join(script_dir, "market_demand.json")
    output_file = os.path.join(script_dir, "skill_trends.json")
    
    generate_all_trends(market_data_file, output_file, months=12)

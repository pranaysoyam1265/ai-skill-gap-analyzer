/**
 * Validation script for Career Advisor integration
 * Run: npx ts-node scripts/validate-career-advisor.ts
 */

import {
  getCareerHealth,
  getCareerRecommendations,
  getCareerTrajectory,
  getSkillJourney,
  generateCareerSummary,
  getSalaryTrends,
  getNetworkingSuggestions,
  getInterviewResources,
  getMarketTrends,
} from '../lib/api/career-advisor-client'

const CANDIDATE_ID = 3 // Test candidate

async function validateEndpoints() {
  console.log('🧪 Validating Career Advisor Endpoints...\n')

  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[],
  }

  // Test 1: Career Health
  try {
    console.log('Testing: Career Health...')
    const health = await getCareerHealth(CANDIDATE_ID)
    if (
      health.skills_relevance >= 0 &&
      health.skills_relevance <= 100 &&
      health.market_alignment >= 0 &&
      health.market_alignment <= 100
    ) {
      console.log('✅ Career Health: PASSED')
      results.passed++
    } else {
      throw new Error('Invalid score range')
    }
  } catch (error) {
    console.error('❌ Career Health: FAILED -', error)
    results.failed++
    results.errors.push(`Career Health: ${error}`)
  }

  // Test 2: Career Recommendations
  try {
    console.log('Testing: Career Recommendations...')
    const recs = await getCareerRecommendations(CANDIDATE_ID, { limit: 3 })
    if (recs.recommendations.length > 0 && recs.recommendations.length <= 3) {
      console.log('✅ Career Recommendations: PASSED')
      results.passed++
    } else {
      throw new Error('Invalid recommendations count')
    }
  } catch (error) {
    console.error('❌ Career Recommendations: FAILED -', error)
    results.failed++
    results.errors.push(`Career Recommendations: ${error}`)
  }

  // Test 3: Career Trajectory
  try {
    console.log('Testing: Career Trajectory...')
    const trajectory = await getCareerTrajectory(CANDIDATE_ID, 8)
    if (trajectory.projections.length === 8) {
      console.log('✅ Career Trajectory: PASSED')
      results.passed++
    } else {
      throw new Error(
        `Expected 8 projections, got ${trajectory.projections.length}`
      )
    }
  } catch (error) {
    console.error('❌ Career Trajectory: FAILED -', error)
    results.failed++
    results.errors.push(`Career Trajectory: ${error}`)
  }

  // Test 4: Skill Journey
  try {
    console.log('Testing: Skill Journey...')
    const journey = await getSkillJourney(CANDIDATE_ID)
    if (journey.events && journey.events.length > 0) {
      console.log('✅ Skill Journey: PASSED')
      results.passed++
    } else {
      throw new Error('Invalid events')
    }
  } catch (error) {
    console.error('❌ Skill Journey: FAILED -', error)
    results.failed++
    results.errors.push(`Skill Journey: ${error}`)
  }

  // Test 5: AI Summary
  try {
    console.log('Testing: AI Summary...')
    const summary = await generateCareerSummary(CANDIDATE_ID)
    if (summary.summary && summary.summary.length > 0) {
      console.log('✅ AI Summary: PASSED')
      results.passed++
    } else {
      throw new Error('Invalid summary structure')
    }
  } catch (error) {
    console.error('❌ AI Summary: FAILED -', error)
    results.failed++
    results.errors.push(`AI Summary: ${error}`)
  }

  // Test 6: Salary Trends
  try {
    console.log('Testing: Salary Trends...')
    const salary = await getSalaryTrends()
    if (salary.salary_by_level && salary.salary_by_level.length > 0) {
      console.log('✅ Salary Trends: PASSED')
      results.passed++
    } else {
      throw new Error('No salary levels returned')
    }
  } catch (error) {
    console.error('❌ Salary Trends: FAILED -', error)
    results.failed++
    results.errors.push(`Salary Trends: ${error}`)
  }

  // Test 7: Networking
  try {
    console.log('Testing: Networking Suggestions...')
    const networking = await getNetworkingSuggestions(CANDIDATE_ID)
    if (networking.suggested_connections && networking.suggested_connections.length > 0) {
      console.log('✅ Networking Suggestions: PASSED')
      results.passed++
    } else {
      throw new Error('No networking suggestions returned')
    }
  } catch (error) {
    console.error('❌ Networking Suggestions: FAILED -', error)
    results.failed++
    results.errors.push(`Networking Suggestions: ${error}`)
  }

  // Test 8: Interview Resources
  try {
    console.log('Testing: Interview Resources...')
    const resources = await getInterviewResources(CANDIDATE_ID)
    if (resources.categories && resources.categories.length > 0) {
      console.log('✅ Interview Resources: PASSED')
      results.passed++
    } else {
      throw new Error('No categories returned')
    }
  } catch (error) {
    console.error('❌ Interview Resources: FAILED -', error)
    results.failed++
    results.errors.push(`Interview Resources: ${error}`)
  }

  // Test 9: Market Trends
  try {
    console.log('Testing: Market Trends...')
    const trends = await getMarketTrends(['React', 'TypeScript'], 12)
    if (trends.months && trends.months.length === 12 && Object.keys(trends.skills).length > 0) {
      console.log('✅ Market Trends: PASSED')
      results.passed++
    } else {
      throw new Error('Invalid trends structure')
    }
  } catch (error) {
    console.error('❌ Market Trends: FAILED -', error)
    results.failed++
    results.errors.push(`Market Trends: ${error}`)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log(`📊 Validation Results:`)
  console.log(`   ✅ Passed: ${results.passed}/9`)
  console.log(`   ❌ Failed: ${results.failed}/9`)

  if (results.failed > 0) {
    console.log('\n❌ Errors:')
    results.errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err}`)
    })
    process.exit(1)
  } else {
    console.log('\n🎉 All tests passed! Career Advisor integration complete.')
    process.exit(0)
  }
}

validateEndpoints()

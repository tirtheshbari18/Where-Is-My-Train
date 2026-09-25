/**
 * Indian Railway Master Database: Automated Data Quality Audit & Report Script
 */

import { generateDataQualityReport } from '../src/services/dataQualityService.js';

export { generateDataQualityReport };

if (process.argv[1]?.includes('dataQualityReport')) {
  const rep = generateDataQualityReport();
  console.log('========================================================');
  console.log(rep.title);
  console.log('========================================================');
  console.log(`Data Version: ${rep.data_version}`);
  console.log(`Overall Status: ${rep.overall_status}`);
  console.log(`Quality Score: ${rep.quality_score}`);
  console.log('Metrics:', JSON.stringify(rep.metrics, null, 2));
  console.log('Verified Distance Samples:', rep.verified_sample_distances);
  if (rep.errors.length === 0) {
    console.log('✅ ZERO ERRORS FOUND. Complete master database verified.');
  } else {
    console.log('Errors:', rep.errors);
  }
}

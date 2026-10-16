import { htmlReport } from './k6-reporter.js';
import { textSummary } from './text-summary.js';

/**
 * Creates a standardized handleSummary exporter for k6 test suites.
 * Outputs:
 *  - HTML interactive report (`reports/<name>.html`)
 *  - JSON machine-readable summary (`reports/<name>.json`)
 *  - Terminal formatted summary (`stdout`)
 *
 * @param {string} scenarioName - e.g., 'smoke-test', 'load-test', 'stress-test', 'spike-test'
 * @param {Object} [options] - Optional title and theme
 * @returns {Function} handleSummary function conforming to k6 signature
 */
export function createSummaryHandler(scenarioName = 'performance-summary', options = {}) {
  return function handleSummary(data) {
    const title = options.title || `${scenarioName.replace(/-/g, ' ').toUpperCase()} Benchmark Report`;
    const theme = options.theme || 'default';

    const htmlOutput = htmlReport(data, {
      title,
      theme,
      debug: false,
    });

    const jsonOutput = JSON.stringify(data, null, 2);
    const consoleOutput = textSummary(data, {
      indent: ' ',
      enableColors: true,
    });

    return {
      [`reports/${scenarioName}.html`]: htmlOutput,
      [`reports/${scenarioName}.json`]: jsonOutput,
      'reports/latest-summary.html': htmlOutput,
      'reports/latest-summary.json': jsonOutput,
      'stdout': consoleOutput,
    };
  };
}

export default createSummaryHandler;

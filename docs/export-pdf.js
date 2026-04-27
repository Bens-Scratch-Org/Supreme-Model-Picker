/* Export-to-PDF handler.
   Uses the browser's native print → "Save as PDF" pipeline. This is far
   more reliable than html2canvas-based libraries for D3/SVG content:
   page breaks, SVG rendering, font kerning, and pagination are all
   handled by the browser. The print stylesheet in styles.css controls
   layout (landscape A4, one section per page, no chart clipping). */
(function () {
  const btn = document.getElementById('export-pdf');
  const label = document.getElementById('export-pdf-label');
  const hint = document.getElementById('export-pdf-hint');
  if (!btn || !label) return;

  if (hint) {
    hint.textContent =
      'Opens your browser\u2019s print dialog. Choose \u201CSave as PDF\u201D as the destination ' +
      '(landscape A4 is preselected).';
  }

  btn.addEventListener('click', () => {
    // The print stylesheet in styles.css does the heavy lifting (page
    // size, breaks, hiding chrome). We just trigger the print dialog.
    window.print();
  });
})();


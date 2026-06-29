(function () {
  const form = document.getElementById('idl-seo-exporter-form');
  const progressBox = document.getElementById('idl-seo-exporter-progress');
  const progressFill = document.getElementById('idl-seo-exporter-progress-fill');
  const progressText = document.getElementById('idl-seo-exporter-progress-text');
  const progressMeta = document.getElementById('idl-seo-exporter-progress-meta');
  const downloadWrap = document.getElementById('idl-seo-exporter-download-wrap');
  const downloadLink = document.getElementById('idl-seo-exporter-download-link');

  if (!form || !window.idlSeoExporter) {
    return;
  }

  let running = false;

  function setButtonsDisabled(disabled) {
    form.querySelectorAll('.idl-seo-export-trigger').forEach((button) => {
      button.disabled = disabled;
    });
  }

  function updateProgress(data) {
    progressBox.hidden = false;
    progressText.textContent = data.message || idlSeoExporter.i18n.running;
    progressMeta.textContent = [
      data.phase ? `Fase: ${data.phase}` : '',
      typeof data.processed === 'number' ? `Righe elaborate: ${data.processed}` : '',
      data.bo_run_id ? `BO run: ${data.bo_run_id}` : '',
      data.bo_last_error ? `Errore BO: ${data.bo_last_error}` : '',
      `Batch: ${idlSeoExporter.batchSize}`,
    ]
      .filter(Boolean)
      .join(' · ');

    if (data.done) {
      progressFill.style.width = '100%';
      progressText.textContent = data.message || idlSeoExporter.i18n.complete;
      if (data.download_url) {
        downloadWrap.hidden = false;
        downloadLink.href = data.download_url;
      }
      return;
    }

    const width = Math.min(95, 10 + (Number(data.processed || 0) / idlSeoExporter.batchSize) * 5);
    progressFill.style.width = `${width}%`;
    downloadWrap.hidden = true;
  }

  async function requestAjax(formData) {
    const response = await fetch(idlSeoExporter.ajaxUrl, {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      const message = json.data && json.data.message ? json.data.message : idlSeoExporter.i18n.failed;
      throw new Error(message);
    }
    return json.data;
  }

  async function startExport(exportType) {
    const formData = new FormData(form);
    formData.append('action', 'idl_seo_export_start');
    formData.append('export_type', exportType);
    formData.append('nonce', idlSeoExporter.nonce);
    return requestAjax(formData);
  }

  async function processBatch(jobId) {
    const formData = new FormData();
    formData.append('action', 'idl_seo_export_batch');
    formData.append('job_id', jobId);
    formData.append('nonce', idlSeoExporter.nonce);
    return requestAjax(formData);
  }

  async function runExport(exportType) {
    if (running) {
      return;
    }

    running = true;
    setButtonsDisabled(true);
    downloadWrap.hidden = true;
    progressBox.hidden = false;
    progressFill.style.width = '5%';
    progressText.textContent = idlSeoExporter.i18n.starting;
    progressMeta.textContent = `Batch: ${idlSeoExporter.batchSize}`;

    try {
      const start = await startExport(exportType);
      let jobId = start.job_id;
      let done = false;

      while (!done) {
        const batch = await processBatch(jobId);
        updateProgress(batch);
        done = Boolean(batch.done);
      }
    } catch (error) {
      progressText.textContent = error.message || idlSeoExporter.i18n.failed;
      progressFill.style.width = '0%';
    } finally {
      running = false;
      setButtonsDisabled(false);
    }
  }

  form.querySelectorAll('.idl-seo-export-trigger').forEach((button) => {
    button.addEventListener('click', () => {
      const exportType = button.getAttribute('data-export-type');
      if (exportType) {
        runExport(exportType);
      }
    });
  });
})();

/**
 * Download Service
 * Handles file downloads (single and batch ZIP)
 */

export class DownloadService {
    /**
     * Download single file
     */
    static downloadFile(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Download multiple files as ZIP
     */
    static async downloadAsZip(files, zipFilename = 'converted_images.zip') {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded');
        }

        const zip = new JSZip();

        // Add all files to ZIP
        files.forEach(({ data, filename }) => {
            const base64Data = data.split(',')[1];
            zip.file(filename, base64Data, { base64: true });
        });

        // Generate ZIP blob
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipContent);

        // Download ZIP
        this.downloadFile(zipUrl, zipFilename);

        // Cleanup
        URL.revokeObjectURL(zipUrl);
    }

    /**
     * Trigger download for conversion results
     */
    static async downloadResults(results, isSingleFile) {
        if (isSingleFile) {
            const { data, filename } = results[0];
            this.downloadFile(data, filename);
        } else {
            await this.downloadAsZip(results);
        }
    }
}

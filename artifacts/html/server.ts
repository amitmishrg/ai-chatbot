import { createDocumentHandler } from '@/lib/artifacts/server';

export const htmlDocumentHandler = createDocumentHandler({
  kind: 'html',
  onCreateDocument: async ({ title, dataStream }) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body>
    <!-- Content for ${title} -->
</body>
</html>`;

    dataStream.write({
      type: 'data-codeDelta',
      data: htmlContent,
    });

    return htmlContent; // Return the HTML content, not just the title
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    // Extract HTML content from the description
    const htmlMatch = description.match(/```html\n([\s\S]*?)\n```/);
    let htmlContent = htmlMatch ? htmlMatch[1] : description;
    
    // If no HTML found in description, use current document content
    if (!htmlContent.includes('<!DOCTYPE') && !htmlContent.includes('<html')) {
      htmlContent = document.content || '';
    }
    
    dataStream.write({
      type: 'data-codeDelta',
      data: htmlContent,
    });

    return htmlContent; // Return the HTML content, not just the title
  },
}); 
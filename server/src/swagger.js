import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const setupSwagger = (app) => {
  const enableDocs = process.env.ENABLE_API_DOCS === 'true';

  if (!enableDocs) {
    console.log('ℹ️ Swagger API Documentation is disabled (ENABLE_API_DOCS=false).');
    return;
  }

  try {
    const openApiFilePath = path.join(__dirname, '../../docs/openapi.json');
    if (fs.existsSync(openApiFilePath)) {
      const openApiSpec = JSON.parse(fs.readFileSync(openApiFilePath, 'utf8'));
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
      console.log('📖 Swagger API Documentation mounted at http://localhost:5000/api-docs');
    }
  } catch (err) {
    console.error('⚠️ Failed to load OpenAPI documentation specification:', err.message);
  }
};

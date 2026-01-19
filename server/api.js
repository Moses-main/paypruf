// ### Option 1: Automatic (Recommended for Beginners)
// ```javascript
import ProofRails from '@proofrails/sdk';

// Creates a new project and returns your API key
const { client, apiKey, projectId } = await ProofRails.createProject({
  label: 'PayPruf'
});

console.log('Save this API key:', apiKey);
// Use the client that's already configured
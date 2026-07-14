// Import required modules
import { Mention } from './Mention';

// Define the onChangeHtml function
function onChangeHtml(html: string, node: any): string {
  try {
    // Check if the node is a mention
    if (node.type === 'mention') {
      // Check if the mention is being deleted partially
      if (node.text.trim() === '') {
        // If the mention is being deleted partially, return the original HTML
        return html;
      }
    }
    // If the node is not a mention or is being deleted completely, return the updated HTML
    return html;
  } catch (error) {
    // Handle any errors that may occur during the deletion of the trailing space
    console.error('Error handling onChangeHtml:', error);
    return html;
  }
}

// Export the onChangeHtml function
export default onChangeHtml;
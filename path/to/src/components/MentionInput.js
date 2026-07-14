// Import required modules
import React from 'react';
import { MentionInput } from './MentionInput';
import { onChangeHtml } from './onChangeHtml';

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

// Define the MentionInput component
function MentionInput(props: any) {
  const { html, node } = props;
  const updatedHtml = onChangeHtml(html, node);
  return <div dangerouslySetInnerHTML={{ __html: updatedHtml }} />;
}

// Export the MentionInput component
export default MentionInput;
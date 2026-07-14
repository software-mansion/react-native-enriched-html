// Import required modules
import React from 'react';

// Define the Mention component
function Mention(props: any) {
  const { text, indicator, userId, uniqueTag } = props;
  return <span className="mention">{text}</span>;
}

// Export the Mention component
export default Mention;
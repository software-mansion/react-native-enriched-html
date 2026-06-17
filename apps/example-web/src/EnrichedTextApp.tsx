import { EnrichedText } from 'react-native-enriched-html';
import './App.css';
import type { TextStyle } from 'react-native';

const SAMPLE_HTML =
  '<h2>Enriched Text</h2>' +
  '<p>This is <b>bold</b> <i>italic</i> <b><i>both</i></b></p>' +
  '<p>Click a <a href="https://swmansion.com">link</a></p>' +
  '<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>';

function EnrichedTextApp() {
  return (
    <div className="container">
      <h1 className="app-title">Enriched Text</h1>
      <EnrichedText style={enrichedTextStyle}>{SAMPLE_HTML}</EnrichedText>
    </div>
  );
}

const enrichedTextStyle: TextStyle = {
  backgroundColor: 'gainsboro',
  width: '100%',
  marginVertical: 12,
  maxHeight: 300,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 8,
  fontSize: 18,
};

export default EnrichedTextApp;

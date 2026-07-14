// Import required modules
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MentionInput from './MentionInput';
import { onChangeHtml } from './onChangeHtml';

// Define a test suite for the MentionInput component
describe('MentionInput component', () => {
  it('should handle the deletion of the trailing space correctly', () => {
    const html = '<p><mention text="@pelargonia0001-test1" indicator="@" userId="user_3DIRyZz9CM7JO7VMsti66T83vKD" uniqueTag="pelargonia0001-test1">@pelargonia0001-test1</mention> </p>';
    const node = { type: 'mention', text: '@pelargonia0001-test1 ' };
    const updatedHtml = onChangeHtml(html, node);
    expect(updatedHtml).toBe(html);
  });

  it('should handle the edge case where the mention is deleted partially', () => {
    const html = '<p><mention text="@pelargonia0001-test1" indicator="@" userId="user_3DIRyZz9CM7JO7VMsti66T83vKD" uniqueTag="pelargonia0001-test1">@pelargonia0001-test1</mention> </p>';
    const node = { type: 'mention', text: '' };
    const updatedHtml = onChangeHtml(html, node);
    expect(updatedHtml).toBe(html);
  });

  it('should handle any errors that may occur during the deletion of the trailing space', () => {
    const html = '<p><mention text="@pelargonia0001-test1" indicator="@" userId="user_3DIRyZz9CM7JO7VMsti66T83vKD" uniqueTag="pelargonia0001-test1">@pelargonia0001-test1</mention> </p>';
    const node = { type: 'mention', text: '@pelargonia0001-test1 ' };
    const error = new Error('Test error');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const updatedHtml = onChangeHtml(html, node);
    expect(updatedHtml).toBe(html);
    jest.restoreAllMocks();
  });
});
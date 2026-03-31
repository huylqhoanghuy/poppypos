import React from 'react';
import { useSettingsManager } from '../hooks/useSettingsManager';
import SettingsUI from '../components/SettingsUI';

export default function Settings() {
  const settingsManager = useSettingsManager();

  return <SettingsUI state={settingsManager.state} actions={settingsManager.actions} />;
}

import React from 'react';
import { useChannelReportsManager } from '../hooks/useChannelReportsManager';
import ChannelReportsUI from '../components/ChannelReportsUI';

const ChannelReports = () => {
  const manager = useChannelReportsManager();
  return <ChannelReportsUI {...manager} />;
};

export default ChannelReports;

import React from 'react';
import ResourceManager from '../components/ResourceManager';

export default function DevicesPage() {
  return (
    <ResourceManager
      title="Devices"
      listPath="/admin/devices"
      createPath="/admin/device"
      updatePath="/admin/device"
      updateMethod="PUT"
      deletePath="/admin/device"
      identifierLabel="udid"
    />
  );
}

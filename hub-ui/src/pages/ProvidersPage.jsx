import React from 'react';
import ResourceManager from '../components/ResourceManager';

export default function ProvidersPage() {
  return (
    <ResourceManager
      title="Providers"
      listPath="/admin/providers"
      createPath="/admin/providers/add"
      updatePath="/admin/providers/update"
      deletePath="/admin/providers"
      identifierLabel="nickname"
      previewKeys={['nickname', 'host_address', 'port']}
    />
  );
}

import React from 'react';
import ResourceManager from '../components/ResourceManager';

export default function ClientCredentialsPage() {
  return (
    <ResourceManager
      title="Client credentials"
      listPath="/admin/client-credentials"
      createPath="/admin/client-credentials"
      updatePath="/admin/client-credentials"
      updateMethod="PUT"
      deletePath="/admin/client-credentials"
      identifierLabel="id"
      previewKeys={['id', 'name', 'client_id']}
    />
  );
}

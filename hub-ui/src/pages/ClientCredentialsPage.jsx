import React from 'react';
import ResourceManager from '../components/ResourceManager';

export default function ClientCredentialsPage() {
  return (
    <ResourceManager
      title="Client credentials"
      listPath="/client-credentials"
      createPath="/client-credentials"
      updatePath="/client-credentials"
      updateMethod="PUT"
      deletePath="/client-credentials"
      identifierLabel="id"
    />
  );
}

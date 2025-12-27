import React from 'react';
import ResourceManager from '../components/ResourceManager';

export default function SecretKeysPage() {
  return (
    <ResourceManager
      title="Secret keys"
      listPath="/admin/secret-keys"
      createPath="/admin/secret-keys"
      updatePath="/admin/secret-keys"
      updateMethod="PUT"
      deletePath="/admin/secret-keys"
      identifierLabel="id"
    />
  );
}

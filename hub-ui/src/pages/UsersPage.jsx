import React from 'react';
import ResourceManager from '../components/ResourceManager';

export default function UsersPage() {
  return (
    <ResourceManager
      title="Users"
      listPath="/admin/users"
      createPath="/admin/user"
      updatePath="/admin/user"
      deletePath="/admin/user"
      identifierLabel="username"
      previewKeys={['username', 'role', 'tenant']}
    />
  );
}

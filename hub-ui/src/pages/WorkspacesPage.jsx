import React from 'react';
import ResourceManager from '../components/ResourceManager';

export default function WorkspacesPage() {
  return (
    <ResourceManager
      title="Workspaces"
      listPath="/admin/workspaces"
      createPath="/admin/workspaces"
      updatePath="/admin/workspaces"
      updateMethod="PUT"
      deletePath="/admin/workspaces"
      identifierLabel="id"
    />
  );
}

// Main API test file - imports all split test files
// This file serves as the entry point for running all API tests

import './api.constructor.test';
import './api.auth.test';
import './api.request.get-basic.test';
import './api.request.authenticated.test';
import './api.request.post.test';
import './api.request.headers.test';
import './api.request.errors.test';
import './api.workspaces.create-basic.test';
import './api.workspaces.create-with-data.test';
import './api.workspaces.create-authenticated.test';
import './api.workspaces.list.test';
import './api.profile.update.test';
import './api.profile.notifications-basic.test';
import './api.profile.notifications-advanced.test';
import './api.profile.get.test';
import './api.integration.auth-flow.test';
import './api.integration.token-management.test';
import './api.integration.errors.test';

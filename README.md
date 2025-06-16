# PixmonMMO
Web Text Based PixmnMMO Project

## Recent Updates

### UserStats Duplicate Records Fix (May 2025)
We've implemented a comprehensive fix for the issue of duplicate UserStats records that was causing database bloat and potential data inconsistency. The fix includes:

- Cleanup of existing duplicate records
- Prevention of future duplicates through database constraints
- Monitoring and automatic cleanup scripts
- Documentation and logging for ongoing maintenance

For full details, see the [UserStats Fix Documentation](./backend/docs/userstats-fix-documentation.md).

## Running the Project
To start the backend server:
```bash
cd backend
npm install
npm start
```

To start the frontend development server:
```bash
cd frontend
npm install
npm run dev
```

## Development Tools

### Terminal Views

We offer several options for running the development environment:

1. **Standard Development Mode** - Basic output with essential information
   ```bash
   npm run dev
   ```

2. **Verbose Development Mode** - More detailed output from both backend and frontend
   ```bash
   npm run dev-verbose
   ```

3. **Developer Dashboard** - Enhanced interface with service status, memory usage, and separated logs
   ```bash
   npm run dev-dashboard
   ```

   Features:
   - Real-time memory and CPU usage monitoring
   - Separated frontend and backend logs
   - Error highlighting and aggregation
   - Process management with automatic restart capabilities
   - Clean visual interface

Choose the view that best suits your development needs. The dashboard is particularly useful when debugging complex issues or monitoring system performance.

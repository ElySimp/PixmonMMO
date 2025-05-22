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

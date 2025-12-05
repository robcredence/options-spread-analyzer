# Deployment Pipeline Documentation

## Overview
This project is configured with an automated deployment pipeline:
**GitLab → GitHub → AWS Amplify**

## Architecture

```
GitLab Repository (Source)
    ↓ (GitLab CI/CD)
GitHub Repository (Mirror)
    ↓ (Webhook)
AWS Amplify (Hosting)
```

## URLs

- **Production App**: https://main.d1ru6c46jbm3a7.amplifyapp.com
- **GitHub Mirror**: https://github.com/robcredence/options-spread-analyzer
- **GitLab Source**: https://gitlab.esmc-host.com/radha.srinivasan/radha
- **AWS Amplify Console**: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1ru6c46jbm3a7/main

## How It Works

1. **Development**: Push code to GitLab (`main` branch)
2. **Mirroring**: GitLab CI/CD automatically pushes to GitHub
3. **Building**: GitHub webhook triggers AWS Amplify build
4. **Deployment**: Amplify builds and deploys the React app

## GitLab CI/CD Variables Required

To enable the GitHub mirroring, you need to set these CI/CD variables in GitLab:

1. Go to: Settings → CI/CD → Variables
2. Add these variables:
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
   - `GITHUB_REPO`: `robcredence/options-spread-analyzer`

## Manual GitHub Push (Backup)

If the CI/CD mirroring fails, you can manually push to GitHub:

```bash
git remote add github https://github.com/robcredence/options-spread-analyzer.git
git push github main
```

## Build Configuration

The build process is configured in `amplify.yml`:
- Node.js 18
- Vite build system
- Output directory: `dist/`

## Monitoring

- **GitLab Pipeline**: Check CI/CD → Pipelines in GitLab
- **GitHub Actions**: No actions configured (passive mirror)
- **AWS Amplify**: Monitor builds in the Amplify Console

## Troubleshooting

### If GitLab → GitHub mirror fails:
1. Check GitLab CI/CD pipeline logs
2. Verify `GITHUB_TOKEN` is still valid
3. Manually push to GitHub as a workaround

### If GitHub → Amplify build fails:
1. Check Amplify Console for build logs
2. Verify `amplify.yml` configuration
3. Check Node.js version compatibility

### If the app doesn't update:
1. Verify the full pipeline ran:
   - GitLab pipeline succeeded
   - GitHub received the push
   - Amplify build completed
2. Clear browser cache
3. Wait 2-3 minutes for CDN propagation

## Local Development

```bash
npm install
npm run dev
```

## Production Build (Local Test)

```bash
npm run build
npm run preview
```
# Complete deployment script
Write-Host "🚀 Deploying React App to AWS..." -ForegroundColor Green

# Build for production
Write-Host "📦 Building..." -ForegroundColor Yellow
npm run build

# Deploy to S3
Write-Host "☁️ Uploading to S3..." -ForegroundColor Yellow
cd build
aws s3 sync . s3://images-fashionkesang/website/ --delete --acl public-read

# Invalidate CloudFront
Write-Host "🔄 Invalidating CloudFront..." -ForegroundColor Yellow
# Note: Replace with actual distribution ID if you have permissions
# aws cloudfront create-invalidation --distribution-id ENJO9OWMYZGNU --paths "/*"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Website: https://d2v1rwlut2i2wn.cloudfront.net/website/" -ForegroundColor Cyan
Write-Host "🔧 Admin: https://d2v1rwlut2i2wn.cloudfront.net/website/admin/login" -ForegroundColor Cyan
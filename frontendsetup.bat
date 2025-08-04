@echo off
REM Batch script to create project structure

REM Define the root project directory
set projectRoot=c:\vs code docs\fashionkeshang\gold-jewelry-frontend\src

REM Create directories
mkdir "%projectRoot%\components\layout"
mkdir "%projectRoot%\components\product"
mkdir "%projectRoot%\components\cart"
mkdir "%projectRoot%\components\checkout"
mkdir "%projectRoot%\components\auth"
mkdir "%projectRoot%\components\admin"
mkdir "%projectRoot%\context"
mkdir "%projectRoot%\hooks"
mkdir "%projectRoot%\services"
mkdir "%projectRoot%\utils"

REM Create files (component files)
type nul > "%projectRoot%\components\layout\Navbar.jsx"
type nul > "%projectRoot%\components\layout\Footer.jsx"
type nul > "%projectRoot%\components\layout\Layout.jsx"

type nul > "%projectRoot%\components\product\ProductCard.jsx"
type nul > "%projectRoot%\components\product\ProductFeed.jsx"
type nul > "%projectRoot%\components\product\ProductDetail.jsx"

type nul > "%projectRoot%\components\cart\CartIcon.jsx"
type nul > "%projectRoot%\components\cart\CartDrawer.jsx"
type nul > "%projectRoot%\components\cart\CartItem.jsx"

type nul > "%projectRoot%\components\checkout\CheckoutForm.jsx"
type nul > "%projectRoot%\components\checkout\PaymentProcess.jsx"

type nul > "%projectRoot%\components\auth\Login.jsx"
type nul > "%projectRoot%\components\auth\Signup.jsx"
type nul > "%projectRoot%\components\auth\OtpVerify.jsx"

type nul > "%projectRoot%\components\admin\Dashboard.jsx"
type nul > "%projectRoot%\components\admin\OrdersManagement.jsx"
type nul > "%projectRoot%\components\admin\UsersManagement.jsx"
type nul > "%projectRoot%\components\admin\ProductManagement.jsx"
type nul > "%projectRoot%\components\admin\AdminLayout.jsx"

REM Create context files
type nul > "%projectRoot%\context\AuthContext.jsx"
type nul > "%projectRoot%\context\CartContext.jsx"

REM Create hooks files
type nul > "%projectRoot%\hooks\useInfiniteScroll.jsx"
type nul > "%projectRoot%\hooks\useRazorpay.jsx"

REM Create service files
type nul > "%projectRoot%\services\api.js"
type nul > "%projectRoot%\services\authService.js"
type nul > "%projectRoot%\services\productService.js"
type nul > "%projectRoot%\services\cartService.js"
type nul > "%projectRoot%\services\orderService.js"

REM Create utility files
type nul > "%projectRoot%\utils\formatCurrency.js"
type nul > "%projectRoot%\utils\validators.js"

REM Create root files
type nul > "%projectRoot%\App.jsx"
type nul > "%projectRoot%\index.jsx"

echo Project structure created successfully!
# 📦 Project Context

Gerado em: 2025-12-19 16:12:11

## 🎯 Objetivo do Projeto
> Descreva aqui o objetivo principal do projeto.

## 🧱 Estrutura de Pastas
```
├── .env
├── .gitignore
├── .gitkeep
├── .manus
│   └── db
│       ├── db-query-1764097783622.json
│       ├── db-query-1764099210872.json
│       ├── db-query-1764099371624.json
│       ├── db-query-1764867042778.json
│       ├── db-query-1764871196212.json
│       ├── db-query-1764871207876.json
│       ├── db-query-1764871216146.json
│       ├── db-query-1764871223407.json
│       ├── db-query-1764872942621.json
│       ├── db-query-1764873036601.json
│       ├── db-query-1764873582289.json
│       ├── db-query-1764928851598.json
│       ├── db-query-1764928871681.json
│       ├── db-query-1764929046282.json
│       ├── db-query-1764931676200.json
│       ├── db-query-1764931700697.json
│       ├── db-query-1764931714074.json
│       ├── db-query-1764931741121.json
│       ├── db-query-1764931753735.json
│       ├── db-query-1764931765919.json
│       ├── db-query-1764932286116.json
│       ├── db-query-1764932384400.json
│       ├── db-query-1764932393501.json
│       ├── db-query-1764932486367.json
│       ├── db-query-1764932510482.json
│       ├── db-query-1764932522366.json
│       ├── db-query-1764932529698.json
│       ├── db-query-1764935086609.json
│       ├── db-query-1764936325026.json
│       ├── db-query-1764937423807.json
│       ├── db-query-1764937708158.json
│       ├── db-query-error-1764684179228.json
│       ├── db-query-error-1764871187738.json
│       ├── db-query-error-1764871201890.json
│       ├── db-query-error-1764931688144.json
│       ├── db-query-error-1764935094112.json
│       └── db-query-error-1764938433953.json
├── .prettierignore
├── .prettierrc
├── ADMIN_SETUP.md
├── AUTH_FIXES_APPLIED.md
├── AUTH_IMPROVEMENTS.md
├── DEV_OAUTH_GUIDE.md
├── DOCUMENTACAO.md
├── ENCRYPTION.md
├── GRAPHICS_SYSTEM.md
├── GUIA_RAPIDO.md
├── INSTALACAO_LOCAL.md
├── LOGIN_OAUTH_GUIDE.md
├── MAINTENANCE_GUIDE.md
├── MEDIA_LIBRARY.md
├── MIGRATION_GUIDE.md
├── PROJECT_STRUCTURE.md
├── README.md
├── ROADMAP.md
├── SECURITY.md
├── SECURITY_IMPLEMENTATION.md
├── WOOCOMMERCE_MIGRATION.md
├── add_size_id.sql
├── assets
│   └── brand-logos
│       ├── alelo.png
│       ├── ben.jpg
│       ├── pluxee.png
│       ├── ticket.jpg
│       ├── verocard.png
│       └── vr.jpg
├── baixados.csv
├── categories-backup.sql
├── client
│   ├── .vite
│   │   └── deps
│   │       ├── _metadata.json
│   │       └── package.json
│   ├── index.html
│   ├── postcss.config.js
│   ├── public
│   │   └── .gitkeep
│   ├── src
│   │   ├── App.tsx
│   │   ├── _core
│   │   │   ├── CartContext.tsx
│   │   │   ├── hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useCheckoutTracking.ts
│   │   │   │   ├── usePasswordStrength.ts
│   │   │   │   └── useTheme.ts
│   │   │   ├── sdk.ts
│   │   │   └── trpc.ts
│   │   ├── components
│   │   │   ├── AIChatBox.tsx
│   │   │   ├── AccompanimentSelector.test.ts
│   │   │   ├── AccompanimentSelector.tsx
│   │   │   ├── AddressForm.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminShippingConfig.tsx
│   │   │   ├── CSVOrdersList.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── DashboardLayoutSkeleton.tsx
│   │   │   ├── DishCard.tsx
│   │   │   ├── DishSelector.tsx
│   │   │   ├── DishSelectorModal.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── GeometricPatterns.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LoyaltyPoints.tsx
│   │   │   ├── ManusDialog.tsx
│   │   │   ├── Map.tsx
│   │   │   ├── MediaLibraryModal.tsx
│   │   │   ├── NutritionalInfo.tsx
│   │   │   ├── PackageDrawer.tsx
│   │   │   ├── PasswordInput.tsx
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   ├── ProductBadge.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductDrawer.backup.tsx
│   │   │   ├── ProductDrawer.tsx
│   │   │   ├── ProductDrawer2.tsx
│   │   │   ├── ProductImageOverlay.tsx
│   │   │   ├── ProductModal.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ui
│   │   │       ├── accordion.tsx
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── alert.tsx
│   │   │       ├── aspect-ratio.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── breadcrumb.tsx
│   │   │       ├── button-group.tsx
│   │   │       ├── button.tsx
│   │   │       ├── calendar.tsx
│   │   │       ├── card.tsx
│   │   │       ├── carousel.tsx
│   │   │       ├── chart.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── collapsible.tsx
│   │   │       ├── command.tsx
│   │   │       ├── context-menu.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── drawer.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── empty.tsx
│   │   │       ├── field.tsx
│   │   │       ├── form.tsx
│   │   │       ├── hover-card.tsx
│   │   │       ├── input-group.tsx
│   │   │       ├── input-otp.tsx
│   │   │       ├── input.tsx
│   │   │       ├── item.tsx
│   │   │       ├── kbd.tsx
│   │   │       ├── label.tsx
│   │   │       ├── menubar.tsx
│   │   │       ├── navigation-menu.tsx
│   │   │       ├── pagination.tsx
│   │   │       ├── popover.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── radio-group.tsx
│   │   │       ├── resizable.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── slider.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── spinner.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── table.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── toggle-group.tsx
│   │   │       ├── toggle.tsx
│   │   │       ├── tooltip.tsx
│   │   │       └── use-toast.ts
│   │   ├── const.ts
│   │   ├── contexts
│   │   │   ├── CartContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks
│   │   │   ├── useCart.ts
│   │   │   ├── useComposition.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useMobile.tsx
│   │   │   └── usePersistFn.ts
│   │   ├── index.css
│   │   ├── lib
│   │   │   ├── trpc.ts
│   │   │   └── utils.ts
│   │   ├── main.tsx
│   │   └── pages
│   │       ├── AdminAppearance.tsx
│   │       ├── AdminCSVOrders.tsx
│   │       ├── AdminCoupons.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminDiscountRules.tsx
│   │       ├── AdminDishes.tsx
│   │       ├── AdminLoyalty.tsx
│   │       ├── AdminOrders.tsx
│   │       ├── AdminPackageOptions.tsx
│   │       ├── AdminPackages.tsx
│   │       ├── AdminPaymentMethods.tsx
│   │       ├── AdminSettings.tsx
│   │       ├── AdminShipping.tsx
│   │       ├── AdminSizesAccompaniments.tsx
│   │       ├── AdminUsers.tsx
│   │       ├── CartPage.tsx
│   │       ├── Checkout.tsx
│   │       ├── ComponentShowcase.tsx
│   │       ├── Home.tsx
│   │       ├── Login.tsx
│   │       ├── LoginPage.tsx
│   │       ├── MyOrders.tsx
│   │       ├── NotFound.tsx
│   │       ├── Packages.tsx
│   │       ├── Products.tsx
│   │       └── Profile.tsx
│   └── tailwind.config.js
├── components.json
├── data
│   ├── Users-Export-2025-Dec-09-142504.csv
│   └── order_export_2025-12-09-02-53-39.csv
├── database-report.json
├── database-report.md
├── diagnostic-report.json
├── dishes-backup.sql
├── drizzle
│   ├── 0000_dapper_magdalene.sql
│   ├── 0000_freezing_james_howlett.sql
│   ├── 0000_known_the_leader.sql
│   ├── 0001_natural_ronan.sql
│   ├── 0001_normal_stick.sql
│   ├── 0001_watery_franklin_storm.sql
│   ├── 0002_curvy_sharon_carter.sql
│   ├── 0002_needy_thunderball.sql
│   ├── 0002_nostalgic_dormammu.sql
│   ├── 0003_round_daredevil.sql
│   ├── 0004_empty_triton.sql
│   ├── 0005_tricky_manta.sql
│   ├── meta
│   │   ├── 0000_snapshot.json
│   │   ├── 0001_snapshot.json
│   │   ├── 0002_snapshot.json
│   │   ├── 0003_snapshot.json
│   │   ├── 0004_snapshot.json
│   │   ├── 0005_snapshot.json
│   │   └── _journal.json
│   ├── migrations
│   │   └── .gitkeep
│   ├── relations.ts
│   ├── schema-new.ts
│   └── schema.ts
├── drizzle.config.ts
├── eslint.config.ts
├── extract-woocommerce-data.mjs
├── extract_woocommerce.py
├── generate-ultimate-report.js
├── hash-password.mjs
├── import-loyalty-csv.ts
├── package.json
├── patches
│   └── wouter@3.7.1.patch
├── points-rewards-export_27-11-2025-17-54-50.csv
├── postcss.config
├── project-report.md
├── project-report.mjs
├── project_context.md
├── restore-all.mjs
├── restore-db.mjs
├── restore-dishes.mjs
├── scripts
│   ├── 01-alter-columns-for-encryption.sql
│   ├── add-general-min.ts
│   ├── add-message-column.ts
│   ├── cleanup-profiles.ts
│   ├── create-admin-user.mjs
│   ├── create_project_context.py
│   ├── db-health.ts
│   ├── debug-woo.ts
│   ├── fix-accompaniments-db.ts
│   ├── fix-activate-dishes.ts
│   ├── fix-add-password.ts
│   ├── fix-addresses-db.ts
│   ├── fix-cart-columns.ts
│   ├── fix-cart-db.ts
│   ├── fix-cart-package.ts
│   ├── fix-cart-size.ts
│   ├── fix-db-schema.ts
│   ├── fix-full-db.ts
│   ├── fix-https-images.ts
│   ├── fix-master.ts
│   ├── fix-packages-columns.ts
│   ├── fix-payment-db.ts
│   ├── fix-user-names.ts
│   ├── fix-users-camelcase.ts
│   ├── force-db-update.ts
│   ├── generate-db-report.ts
│   ├── generate-diagnostic-report.ts
│   ├── generate-project-report.ts
│   ├── import-woo-db.ts
│   ├── import-yith-db.ts
│   ├── importar-acompanhamentos.ts
│   ├── importar-itens-pedidos.ts
│   ├── importar-nutricao.ts
│   ├── importar-pedidos.ts
│   ├── importar-usuarios.ts
│   ├── inspect-db.ts
│   ├── migrador.ts
│   ├── migrate-addresses.ts
│   ├── migrate-csv-documents.ts
│   ├── migrate-encrypt-existing-data.ts
│   ├── migrate-from-old-db.ts
│   ├── migrate-orders-from-csv.ts
│   ├── migrate-orders-from-old-db.ts
│   ├── migrate-tool.ts
│   ├── migrate-users-cpf-from-csv.ts
│   ├── migrate-users-profiles-from-old-db.ts
│   ├── migrate-woocommerce-to-gourmet.ts
│   ├── seed-payment-brands-simple.mjs
│   ├── seed-payment-brands.mjs
│   ├── set-admin-password.ts
│   └── test-connection.ts
├── server
│   ├── _core
│   │   ├── context-secure.ts
│   │   ├── context.ts
│   │   ├── cookies.ts
│   │   ├── dataApi.ts
│   │   ├── dev-oauth.ts
│   │   ├── env.ts
│   │   ├── imageGeneration.ts
│   │   ├── index.ts
│   │   ├── llm.ts
│   │   ├── map.ts
│   │   ├── notification.ts
│   │   ├── oauth.ts
│   │   ├── sdk.ts
│   │   ├── security-middleware.ts
│   │   ├── systemRouter.ts
│   │   ├── trpc.ts
│   │   ├── types
│   │   │   ├── cookie.d.ts
│   │   │   └── manusTypes.ts
│   │   ├── vite.ts
│   │   └── voiceTranscription.ts
│   ├── accompaniments.test.ts
│   ├── admin-dishes.ts
│   ├── admin-loyalty.ts
│   ├── admin-orders.ts
│   ├── admin-packages.ts
│   ├── admin-payment-methods.ts
│   ├── admin-reports.ts
│   ├── admin-settings.ts
│   ├── admin-sizes-accompaniments.ts
│   ├── admin-sizes.ts
│   ├── admin-users.ts
│   ├── admin.test.ts
│   ├── auth-password.test.ts
│   ├── auth-password.ts
│   ├── auth.logout.test.ts
│   ├── cart.test.ts
│   ├── cart.ts
│   ├── check-columns.ts
│   ├── coupon.ts
│   ├── csv-orders-parser.ts
│   ├── csv-orders-router.ts
│   ├── customer-addresses.ts
│   ├── db.ts
│   ├── debug-insert.ts
│   ├── discountRules.ts
│   ├── dishes.ts
│   ├── encryption.ts
│   ├── fix-db.ts
│   ├── fix-final.ts
│   ├── fix-loyalty-final.ts
│   ├── fix-orders-db.ts
│   ├── loyalty.test.ts
│   ├── loyalty.ts
│   ├── media-library.ts
│   ├── order.ts
│   ├── orders.ts
│   ├── packages.test.ts
│   ├── packages.ts
│   ├── payment.test.ts
│   ├── payment.ts
│   ├── paymentMethods.ts
│   ├── routers
│   │   ├── addresses.ts
│   │   ├── admin
│   │   │   ├── coupons.ts
│   │   │   ├── discountRules.ts
│   │   │   ├── dishes.ts
│   │   │   ├── finance.ts
│   │   │   ├── packages.ts
│   │   │   └── users.ts
│   │   ├── admin-shipping.ts
│   │   ├── auth.ts
│   │   ├── cart.ts
│   │   ├── client
│   │   ├── index.ts
│   │   ├── packages.ts
│   │   ├── packages_test.ts
│   │   ├── paymentMethods.ts
│   │   └── public-payment-methods.ts
│   ├── routers.ts
│   ├── routers3.ts
│   ├── routers_additions.txt
│   ├── seed-brands.ts
│   ├── seed-payment-shipping.mjs
│   ├── shipping.ts
│   ├── storage.ts
│   ├── storeSettings.ts
│   ├── test-decrypt-addresses.mjs
│   ├── theme.ts
│   ├── viacep.ts
│   ├── woocommerce.test.ts
│   └── woocommerce.ts
├── shared
│   ├── _core
│   │   └── errors.ts
│   ├── const.ts
│   └── types.ts
├── todo.md
├── tsconfig.json
├── ultimate-project-report.md
├── ultimate-report.txt
├── vite.config.ts
├── vite.config.ts.bak
├── vitest.config.ts
├── woo-categories.json
├── woo-customers.json
├── woo-orders.json
├── woo-products.json
└── woo-summary.json
```

## 🧠 Observações Arquiteturais
- Backend: Node.js + tRPC + Drizzle + MariaDB
- Frontend: React + Vite + TypeScript
- Auth: OAuth custom

## ⚠️ Pontos Sensíveis
- Criptografia de dados sensíveis
- Fluxo de carrinho e pacotes
- Rotas administrativas

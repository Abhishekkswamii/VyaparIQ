## Ports

Service                 Internal                External(working ports)
frontend                5173                    5174
backend                 5000                    5001
postgres                5432                    5433
redis                   6379                    6380
ai-service              8000                    8002
nginx                   80                      80


## API ROUTES

Method      Endpoint        Auth        Description
GET         /api/health     No          Health check
POST        /api/auth/register      No          Register
POST        /api/auth/login         No          Login
POST        /api/auth/logout        No          Logout
GET         /api/products           No          List products
GET         /api/products/search?q=  No          Search products
GET         /api/cart               Yes         View cart
POST        /api/cart               Yes         Add to cart
DELETE      /api/cart?item_id=      Yes         Remove from cart
POST        /api/cart/checkout      Yes         Checkout
GET         /api/budget             Yes         View budget
PUT         /api/budget             Yes         Set budget
GET         /api/budget/alerts      Yes         Budget alerts
GET         /api/sessions           Yes         Shopping history




#!/usr/bin/env python3

import http.server

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler

try:
    with http.server.HTTPServer(("", PORT), Handler) as httpd:
        print("Serving at port", PORT)
        httpd.serve_forever()
except KeyboardInterrupt:
    print("Stopping server")

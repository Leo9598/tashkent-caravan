import http.server
import socketserver
import json
import os

PORT = 8088
DIRECTORY = "/var/www/tashkent-caravan"
RESERVATIONS_FILE = os.path.join(DIRECTORY, "reservations.json")
STATUS_FILE = os.path.join(DIRECTORY, "site_status.json")
ALT_STATUS_FILE = "/tmp/tashkent_global_site_status.json"

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

class TashkentCaravanHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path.startswith('/api/site-status'):
            is_open = True
            for sf in [STATUS_FILE, ALT_STATUS_FILE]:
                if os.path.exists(sf):
                    try:
                        with open(sf, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            is_open = data.get('isOpen', True)
                            break
                    except Exception:
                        is_open = True
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"isOpen": is_open}).encode('utf-8'))
            return
        
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/site-status':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                pin = data.get('pin')
                is_open = data.get('isOpen', True)
                
                if pin not in ['111221', 'admin']:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "error", "message": "Invalid PIN code"}).encode('utf-8'))
                    return
                
                for sf in [STATUS_FILE, ALT_STATUS_FILE]:
                    try:
                        with open(sf, 'w', encoding='utf-8') as f:
                            json.dump({"isOpen": bool(is_open)}, f)
                    except Exception:
                        pass
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "isOpen": bool(is_open)}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
            return

        if self.path == '/api/reservations':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                reservation = json.loads(post_data.decode('utf-8'))
                
                reservations = []
                if os.path.exists(RESERVATIONS_FILE):
                    try:
                        with open(RESERVATIONS_FILE, 'r', encoding='utf-8') as f:
                            reservations = json.load(f)
                    except Exception:
                        reservations = []

                reservations.append(reservation)

                with open(RESERVATIONS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(reservations, f, ensure_ascii=False, indent=2)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"status": "success", "message": "Reservation saved"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"status": "error", "message": str(e)}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        self.send_error(404, "Endpoint not found")

if __name__ == "__main__":
    if not os.path.exists(RESERVATIONS_FILE):
        with open(RESERVATIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)

    handler = TashkentCaravanHandler
    with ThreadedTCPServer(("", PORT), handler) as httpd:
        print(f"Tashkent Caravan Server running multithreaded at http://localhost:{PORT}")
        httpd.serve_forever()


import http.server
import socketserver
import json
import os

PORT = 8088
DIRECTORY = "/var/www/tashkent-caravan"
RESERVATIONS_FILE = os.path.join(DIRECTORY, "reservations.json")

class TashkentCaravanHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path == '/api/reservations':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                reservation = json.loads(post_data.decode('utf-8'))
                
                # Load existing reservations
                reservations = []
                if os.path.exists(RESERVATIONS_FILE):
                    try:
                        with open(RESERVATIONS_FILE, 'r', encoding='utf-8') as f:
                            reservations = json.load(f)
                    except Exception:
                        reservations = []

                reservations.append(reservation)

                # Save back to file
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
        else:
            self.send_error(404, "Endpoint not found")

if __name__ == "__main__":
    if not os.path.exists(RESERVATIONS_FILE):
        with open(RESERVATIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)

    handler = TashkentCaravanHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Tashkent Caravan Server running at http://localhost:{PORT}")
        httpd.serve_forever()

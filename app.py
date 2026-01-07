from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app) # Разрешаем запросы с любых источников

# Хранилище: { "USER_ID": { "username": "Name", "jobId": "ID", "placeId": 123, "last_seen": 0.0, "queue": [] } }
online_users = {}

# Время жизни сессии (если игрок не пинговал 30 сек - удаляем из списка)
TIMEOUT = 30

@app.route('/')
def home():
    return "Velvet Command Server is Running!"

@app.route('/heartbeat', methods=['POST'])
def heartbeat():
    try:
        data = request.json
        user_id = str(data.get('userId'))
        
        # Если юзера нет или он прислал пустоту
        if not user_id:
            return jsonify({"error": "No User ID"}), 400

        # Регистрируем/Обновляем юзера
        if user_id not in online_users:
            online_users[user_id] = {"queue": []}
        
        online_users[user_id].update({
            "username": data.get('username'),
            "jobId": data.get('jobId'),
            "placeId": data.get('placeId'),
            "last_seen": time.time()
        })
        
        # Проверяем, есть ли для него команды
        command_to_execute = None
        if len(online_users[user_id]["queue"]) > 0:
            command_to_execute = online_users[user_id]["queue"].pop(0)
            print(f"[CMD SENT] To {data.get('username')}: {command_to_execute}")
            
        return jsonify({"status": "ok", "command": command_to_execute})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/admin/users', methods=['GET'])
def get_users():
    # Очистка мертвых сессий перед показом
    current_time = time.time()
    dead_users = [uid for uid, data in online_users.items() if current_time - data["last_seen"] > TIMEOUT]
    
    for uid in dead_users:
        del online_users[uid]
        
    # Формируем красивый список для админа
    response_list = []
    for uid, data in online_users.items():
        response_list.append({
            "userId": uid,
            "username": data["username"],
            "jobId": data["jobId"],
            "placeId": data["placeId"]
        })
        
    return jsonify(response_list)

@app.route('/admin/command', methods=['POST'])
def send_command():
    data = request.json
    target_id = str(data.get('targetId'))
    command_name = data.get('command')
    args = data.get('args', {})
    
    if target_id in online_users:
        online_users[target_id]["queue"].append({
            "cmd": command_name,
            "args": args
        })
        return jsonify({"status": "queued"})
    else:
        return jsonify({"status": "user offline"}), 404

if __name__ == '__main__':
    # Запуск на порту 10000 (стандарт Render)
    app.run(host='0.0.0.0', port=10000)
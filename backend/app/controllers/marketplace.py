from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
import datetime
import os
from ..utils.upload import save_image
from .. import cache, limiter
from werkzeug.utils import secure_filename
import uuid

marketplace_bp = Blueprint('marketplace', __name__)
client = MongoClient('mongodb://localhost:27017/')
db = client.bracu_circle

@marketplace_bp.route('/items', methods=['GET'])
@limiter.limit("30 per minute")
@cache.cached(timeout=60)
def get_items():
    try:
        # Get the items from the database
        items = list(db.marketplace_items.find())
        
        # Convert ObjectId to string
        for item in items:
            item['_id'] = str(item['_id'])
            item['user_id'] = str(item['user_id'])
        
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@marketplace_bp.route('/items', methods=['POST'])
@limiter.limit("10 per minute")
@jwt_required()
def create_item():
    try:
        user_id = get_jwt_identity()
        data = request.form.to_dict()
        # Validate required fields
        required_fields = ['title', 'description', 'price', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads')
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
        # Handle multiple images
        images = request.files.getlist('images')
        image_urls = []
        for file in images[:3]:  # Limit to 3 images
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                image_urls.append(f"/uploads/{unique_filename}")
        if not image_urls:
            return jsonify({'error': 'No image(s) provided'}), 400
        item_data = {
            "title": data['title'],
            "description": data['description'],
            "price": float(data['price']),
            "category": data['category'],
            "images": image_urls,
            "user_id": ObjectId(user_id),
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
        result = db.marketplace_items.insert_one(item_data)
        cache.delete('view/api/marketplace/items')
        return jsonify({"message": "Item created successfully", "item_id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@marketplace_bp.route('/items/user/<user_id>', methods=['GET'])
@limiter.limit("30 per minute")
def get_items_by_user(user_id):
    try:
        items = list(db.marketplace_items.find({'user_id': ObjectId(user_id)}))
        for item in items:
            item['_id'] = str(item['_id'])
            item['user_id'] = str(item['user_id'])
        return jsonify(items), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/items/<item_id>', methods=['GET'])
@limiter.limit("60 per minute")
@cache.cached(timeout=120)
def get_item(item_id):
    try:
        # Get the item from the database
        item = db.marketplace_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Convert ObjectId to string
        item['_id'] = str(item['_id'])
        item['user_id'] = str(item['user_id'])
        
        # Get user details
        user = db.users.find_one({"_id": ObjectId(item['user_id'])})
        if user:
            item['user'] = {
                "name": user.get('name', ''),
                "email": user.get('email', '')
            }
        
        return jsonify(item), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@marketplace_bp.route('/items/<item_id>', methods=['PUT'])
@limiter.limit("20 per minute")
@jwt_required()
def update_item(item_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        item = db.marketplace_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        # Check if user is admin
        from flask_jwt_extended import get_jwt
        claims = get_jwt()
        is_admin = claims.get('role') == 'admin'

        # Only allow owner or admin
        if str(item['user_id']) != str(user_id) and not is_admin:
            return jsonify({'error': 'Unauthorized to update this item'}), 403

        update_data = {
            "title": data.get('title', item['title']),
            "description": data.get('description', item['description']),
            "price": float(data.get('price', item['price'])),
            "category": data.get('category', item['category']),
            "updated_at": datetime.datetime.utcnow()
        }
        if 'image' in request.files:
            image = request.files['image']
            if image.filename != '':
                if item.get('image_url'):
                    old_image_path = os.path.join(current_app.config.get('UPLOAD_FOLDER', '../uploads'), item['image_url'])
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)
                update_data['image_url'] = save_image(image, 'marketplace')
        db.marketplace_items.update_one(
            {'_id': ObjectId(item_id)},
            {'$set': update_data}
        )
        cache.delete('view/api/marketplace/items')
        cache.delete(f'view/api/marketplace/items/{item_id}')
        return jsonify({'message': 'Item updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@marketplace_bp.route('/items/<item_id>', methods=['DELETE'])
@limiter.limit("20 per minute")
@jwt_required()
def delete_item(item_id):
    try:
        user_id = get_jwt_identity()
        item = db.marketplace_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        # Check if user is admin
        from flask_jwt_extended import get_jwt
        claims = get_jwt()
        is_admin = claims.get('role') == 'admin'

        # Only allow owner or admin
        if str(item['user_id']) != str(user_id) and not is_admin:
            return jsonify({'error': 'Unauthorized to delete this item'}), 403

        db.marketplace_items.delete_one({'_id': ObjectId(item_id)})
        if item.get('image_url'):
            image_path = os.path.join(current_app.config.get('UPLOAD_FOLDER', '../uploads'), item['image_url'])
            if os.path.exists(image_path):
                os.remove(image_path)
        cache.delete('view/api/marketplace/items')
        cache.delete(f'view/api/marketplace/items/{item_id}')
        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
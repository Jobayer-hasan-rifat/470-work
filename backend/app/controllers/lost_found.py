from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
import datetime
from .. import cache, limiter

lost_found_bp = Blueprint('lost_found', __name__)
client = MongoClient('mongodb://localhost:27017/')
db = client.bracu_circle

@lost_found_bp.route('/items', methods=['GET'])
@limiter.limit("30 per minute")
def get_items():
    items = list(db.lost_found_items.find())
    for item in items:
        item['_id'] = str(item['_id'])
        if 'user_id' in item:
            item['user_id'] = str(item['user_id'])
    
    # Add cache control headers
    response = jsonify(items)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response, 200

@lost_found_bp.route('/items', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def create_item():
    data = request.get_json()
    
    # Validate request data
    required_fields = ['title', 'description', 'item_type', 'location', 'date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing {field}'}), 400
    
    # Validate item_type (lost or found)
    if data['item_type'] not in ['lost', 'found']:
        return jsonify({'error': 'Item type must be "lost" or "found"'}), 400
    
    user_id = get_jwt_identity()
    
    new_item = {
        'title': data['title'],
        'description': data['description'],
        'item_type': data['item_type'],
        'location': data['location'],
        'date': data['date'],
        'user_id': ObjectId(user_id),
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow(),
        'status': 'open'
    }
    
    if 'images' in data:
        new_item['images'] = data['images']
    
    if 'category' in data:
        new_item['category'] = data['category']
    
    result = db.lost_found_items.insert_one(new_item)
    
    # Clear all related caches
    cache.delete('view/api/lost-found/items')
    cache.delete(f'view/api/lost-found/user-items/{user_id}')
    cache.delete_many('view/api/lost-found/*')
    cache.delete_many('view/api/admin/*')  # Clear admin related caches
    
    return jsonify({
        'message': 'Item reported successfully',
        'item_id': str(result.inserted_id)
    }), 201

@lost_found_bp.route('/items/<item_id>', methods=['GET'])
@limiter.limit("30 per minute")
def get_item(item_id):
    try:
        item = db.lost_found_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        item['_id'] = str(item['_id'])
        if 'user_id' in item:
            item['user_id'] = str(item['user_id'])
        
        # Add cache control headers
        response = jsonify(item)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response, 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@lost_found_bp.route('/user-items/<user_id>', methods=['GET'])
@limiter.limit("30 per minute")
@jwt_required()
def get_user_items(user_id):
    try:
        # Get user's ID from JWT token for authorization
        token_user_id = get_jwt_identity()
        
        # Only allow users to access their own data or admin
        if token_user_id != user_id:
            # Check if user is admin
            admin_user = db.users.find_one({"_id": ObjectId(token_user_id), "role": "admin"})
            if not admin_user:
                return jsonify({"error": "Unauthorized access to user data"}), 403
        
        # Get user's items from database using ObjectId
        items = list(db.lost_found_items.find({"user_id": ObjectId(user_id)}))
        
        # Convert ObjectIds to strings
        for item in items:
            item['_id'] = str(item['_id'])
            item['user_id'] = str(item['user_id'])
        
        # Add cache control headers
        response = jsonify(items)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response, 200
    except Exception as e:
        current_app.logger.error(f"Error getting user items: {str(e)}")
        return jsonify({"error": str(e)}), 500

@lost_found_bp.route('/items/<item_id>', methods=['PUT'])
@limiter.limit("20 per minute")
@jwt_required()
def update_item(item_id):
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Check if item exists and belongs to user
        item = db.lost_found_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if str(item['user_id']) != user_id:
            # Check if user is admin
            admin_user = db.users.find_one({"_id": ObjectId(user_id), "role": "admin"})
            if not admin_user:
                return jsonify({'error': 'Unauthorized to update this item'}), 403
        
        # Update fields
        update_data = {'updated_at': datetime.datetime.utcnow()}
        allowed_fields = ['title', 'description', 'location', 'date', 'status', 'images', 'category']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        db.lost_found_items.update_one(
            {'_id': ObjectId(item_id)},
            {'$set': update_data}
        )
        
        # Clear all related caches
        cache.delete('view/api/lost-found/items')
        cache.delete(f'view/api/lost-found/items/{item_id}')
        cache.delete(f'view/api/lost-found/user-items/{str(item["user_id"])}')
        cache.delete_many('view/api/lost-found/*')
        cache.delete_many('view/api/admin/*')  # Clear admin related caches
        
        return jsonify({'message': 'Item updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@lost_found_bp.route('/items/<item_id>', methods=['DELETE'])
@limiter.limit("20 per minute")
@jwt_required()
def delete_item(item_id):
    try:
        user_id = get_jwt_identity()
        
        # Check if item exists and belongs to user
        item = db.lost_found_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if str(item['user_id']) != user_id:
            # Check if user is admin
            admin_user = db.users.find_one({"_id": ObjectId(user_id), "role": "admin"})
            if not admin_user:
                return jsonify({'error': 'Unauthorized to delete this item'}), 403
        
        # Store user_id before deleting for cache invalidation
        item_user_id = str(item['user_id'])
        
        # Delete item
        db.lost_found_items.delete_one({'_id': ObjectId(item_id)})
        
        # Clear all related caches
        cache.delete('view/api/lost-found/items')
        cache.delete(f'view/api/lost-found/items/{item_id}')
        cache.delete(f'view/api/lost-found/user-items/{item_user_id}')
        cache.delete_many('view/api/lost-found/*')
        cache.delete_many('view/api/admin/*')  # Clear admin related caches
        
        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
@lost_found_bp.route('/claim/<item_id>', methods=['POST'])
@limiter.limit("10 per minute")
@jwt_required()
def claim_item(item_id):
    try:
        user_id = get_jwt_identity()
        
        # Check if item exists
        item = db.lost_found_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Only allow claiming "found" items
        if item['item_type'] != 'found':
            return jsonify({'error': 'Only found items can be claimed'}), 400
        
        # Already claimed
        if item['status'] == 'claimed':
            return jsonify({'error': 'Item already claimed'}), 400
        
        claim_data = request.get_json() or {}
        
        # Create claim
        claim = {
            'item_id': item_id,
            'claimant_id': user_id,
            'proof': claim_data.get('proof', ''),
            'contact': claim_data.get('contact', ''),
            'status': 'pending',
            'created_at': datetime.datetime.utcnow()
        }
        
        db.claims.insert_one(claim)
        
        # Clear related caches
        cache.delete(f'view/api/lost-found/items/{item_id}')
        cache.delete_many('view/api/lost-found/*')
        cache.delete_many('view/api/admin/*')
        
        return jsonify({'message': 'Claim submitted successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400 
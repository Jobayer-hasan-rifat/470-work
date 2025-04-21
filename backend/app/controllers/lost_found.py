from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
import datetime

lost_found_bp = Blueprint('lost_found', __name__)
client = MongoClient('mongodb://localhost:27017/')
db = client.bracu_circle

@lost_found_bp.route('/items', methods=['GET'])
def get_items():
    items = list(db.lost_found_items.find())
    for item in items:
        item['_id'] = str(item['_id'])
    
    return jsonify(items), 200

@lost_found_bp.route('/items', methods=['POST'])
@jwt_required()
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
        'user_id': user_id,
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow(),
        'status': 'open'
    }
    
    if 'images' in data:
        new_item['images'] = data['images']
    
    if 'category' in data:
        new_item['category'] = data['category']
    
    result = db.lost_found_items.insert_one(new_item)
    
    return jsonify({
        'message': 'Item reported successfully',
        'item_id': str(result.inserted_id)
    }), 201

@lost_found_bp.route('/items/<item_id>', methods=['GET'])
def get_item(item_id):
    try:
        item = db.lost_found_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        item['_id'] = str(item['_id'])
        
        return jsonify(item), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@lost_found_bp.route('/items/<item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Check if item exists and belongs to user
        item = db.lost_found_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item['user_id'] != user_id:
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
        
        return jsonify({'message': 'Item updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@lost_found_bp.route('/claim/<item_id>', methods=['POST'])
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
        
        return jsonify({'message': 'Claim submitted successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400 
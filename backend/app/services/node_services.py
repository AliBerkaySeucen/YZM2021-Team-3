from models.node import NodeCreate, NodeInfoDelete, NodePublic, NodeUpdate, NodeOp, NodeDataFields as df
from db.db import supabase
from typing import Any, Annotated, Literal
from enum import Enum
from fastapi import HTTPException
import json
import base64
import uuid
import logging

logger = logging.getLogger(__name__)

class NodeService:
    def __init__(self):
        pass

    def _wrap_node_op(self, payload: NodeOp):
        """Wraps user_id and image_id fields of NodeOp for other special purpose models."""
        return payload.model_dump()
    
    def _check_memory_limit(self, user_id: int):
        """Check if user has reached their memory limit"""
        # Get user info
        user_response = supabase.table("users").select("is_premium", "memory_limit")\
            .eq("user_id", user_id).execute()
        
        if not user_response.data:
            return  # User not found, let it proceed
        
        user = user_response.data[0]
        is_premium = user.get('is_premium', False)
        
        # Premium users have unlimited memories
        if is_premium:
            return
        
        # Check current memory count
        count_response = supabase.table("nodes").select("*", count="exact")\
            .eq("user_id", user_id).execute()
        
        current_count = count_response.count or 0
        memory_limit = user.get('memory_limit', 30)
        
        if current_count >= memory_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Memory limit reached ({memory_limit} memories). Upgrade to Premium for unlimited memories."
            )

    def create_node(self, payload: NodeCreate):
        # Check memory limit before creating
        self._check_memory_limit(payload.user_id)
        
        node_dump = self._wrap_node_op(payload)
        
        # Handle image: if image_id contains base64 data, save it to images table
        image_data = node_dump.get('image_id', '')
        logger.debug(f"create_node: Received image_id length={len(image_data)}, starts_with={image_data[:50] if image_data else 'empty'}")
        
        # Check if it's base64 data (longer than typical UUID and contains base64 pattern)
        if image_data and (len(image_data) > 100 or 'base64,' in image_data or image_data.startswith('data:')):
            logger.debug(f"create_node: Processing as base64 image data")
            # Extract base64 data
            if 'base64,' in image_data:
                base64_data = image_data.split('base64,')[1]
            else:
                base64_data = image_data
            
            # Save to images table
            try:
                image_record = supabase.table("images").insert({
                    "user_id": payload.user_id,
                    "file_path": base64_data  # Store base64 directly in file_path
                }).execute()
                
                if image_record.data:
                    # Use the image_id from the database
                    new_image_id = str(image_record.data[0].get('image_id', ''))
                    node_dump['image_id'] = new_image_id
                    logger.info(f"create_node: Saved image with ID {new_image_id}")
                else:
                    node_dump['image_id'] = ''
                    logger.warning(f"create_node: Failed to save image")
            except Exception as e:
                logger.error(f"create_node: Error saving image: {e}")
                node_dump['image_id'] = ''
        
        # Convert tags list to JSON string for storage
        if 'tags' in node_dump:
            node_dump['tags'] = json.dumps(node_dump['tags'])
        
        logger.debug(f"create_node: Inserting node with image_id={node_dump.get('image_id')}")
        db_response = supabase.table("nodes").insert(node_dump).execute()
        result = db_response.data[0] if db_response.data else None
        
        if result:
            logger.info(f"create_node: Created node {result.get('node_id')} with image_id={result.get('image_id')}")
            # Convert tags back to list
            if 'tags' in result and result['tags']:
                try:
                    result['tags'] = json.loads(result['tags'])
                except:
                    result['tags'] = []
            
            # Load image data if image_id exists
            if result.get('image_id'):
                try:
                    image_record = supabase.table("images").select("file_path")\
                        .eq("image_id", result['image_id']).execute()
                    if image_record.data:
                        # Return base64 data with proper prefix
                        base64_data = image_record.data[0].get('file_path', '')
                        if base64_data and not base64_data.startswith('data:'):
                            result['image_data'] = f"data:image/jpeg;base64,{base64_data}"
                        else:
                            result['image_data'] = base64_data
                except Exception as e:
                    logger.error(f"Error loading image: {e}")
        
        return result
    
    def list_nodes(self, user_id: int, limit: int = 40, offset: int = 0):
        """Get nodes for a user with pagination"""
        # Get total count for pagination
        count_response = supabase.table("nodes").select("*", count="exact")\
            .eq(df.user_id.value, user_id)\
            .execute()
        total_count = count_response.count if hasattr(count_response, 'count') else 0
        
        db_response = supabase.table("nodes").select("*")\
            .eq(df.user_id.value, user_id)\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        results = db_response.data if db_response.data else []
        
        logger.debug(f"list_nodes: Found {len(results)} nodes for user {user_id}, total={total_count}")
        
        # Convert tags from JSON string to list and load images for each node
        for node in results:
            node_id = node.get('node_id', 'unknown')
            image_id = node.get('image_id')
            logger.debug(f"Node {node_id}: image_id = {image_id}")
            
            if 'tags' in node and node['tags']:
                try:
                    node['tags'] = json.loads(node['tags'])
                except:
                    node['tags'] = []
            else:
                node['tags'] = []
            
            # Load image data if image_id exists
            if image_id:
                try:
                    image_record = supabase.table("images").select("file_path")\
                        .eq("image_id", image_id).execute()
                    if image_record.data:
                        base64_data = image_record.data[0].get('file_path', '')
                        if base64_data:
                            if not base64_data.startswith('data:'):
                                node['image_data'] = f"data:image/jpeg;base64,{base64_data}"
                            else:
                                node['image_data'] = base64_data
                            logger.debug(f"Node {node_id}: Loaded image ({len(base64_data)} chars)")
                        else:
                            logger.debug(f"Node {node_id}: No image data in record")
                    else:
                        logger.debug(f"Node {node_id}: Image record not found")
                except Exception as e:
                    logger.error(f"Node {node_id}: Error loading image: {e}")
            else:
                logger.debug(f"Node {node_id}: No image_id")
        
        return {"nodes": results, "total_count": total_count}
    
    def update_node(self, payload: NodeUpdate):
        node_dump = self._wrap_node_op(payload)
        
        logger.debug(f"update_node: node_id={payload.node_id}, image_id_length={len(node_dump.get('image_id', ''))}")
        
        # Handle image update: if image_id contains base64 data, save it
        image_data = node_dump.get('image_id', '')
        # Only process if image_data is non-empty and contains base64
        should_update_image = image_data and len(image_data) > 100 and ('base64,' in image_data or image_data.startswith('data:'))
        
        if should_update_image:
            logger.debug(f"update_node: Processing new image data")
            # Extract base64 data
            if 'base64,' in image_data:
                base64_data = image_data.split('base64,')[1]
            else:
                base64_data = image_data
            
            # Get old image_id to potentially delete it
            old_node = supabase.table("nodes").select("image_id")\
                .eq(df.user_id.value, payload.user_id)\
                .eq(df.node_id.value, payload.node_id)\
                .execute()
            old_image_id = old_node.data[0].get('image_id') if old_node.data else None
            
            # Save new image to images table
            try:
                image_record = supabase.table("images").insert({
                    "user_id": payload.user_id,
                    "file_path": base64_data
                }).execute()
                
                if image_record.data:
                    node_dump['image_id'] = str(image_record.data[0].get('image_id', ''))
                    
                    # Delete old image if it exists
                    if old_image_id:
                        try:
                            supabase.table("images").delete()\
                                .eq("image_id", old_image_id).execute()
                            logger.info(f"update_node: Deleted old image {old_image_id}")
                        except Exception as e:
                            logger.error(f"Error deleting old image: {e}")
            except Exception as e:
                logger.error(f"Error saving new image: {e}")
                # Don't update image_id if save failed
                node_dump.pop('image_id', None)
        else:
            # No new image - CRITICAL: Don't touch image_id!
            logger.debug(f"update_node: No image update, preserving existing image_id")
            node_dump.pop('image_id', None)
        
        # Build update dict - only include fields that are actually present
        update_data = {}
        
        # Only update image_id if we just processed new image data
        if 'image_id' in node_dump:
            update_data[df.image_id.value] = node_dump['image_id']
            logger.debug(f"update_node: Will update image_id to {node_dump['image_id']}")
        
        # Always update description if present
        if df.description.value in node_dump:
            update_data[df.description.value] = node_dump[df.description.value]
        
        # Add optional fields if present
        if 'title' in node_dump and node_dump['title'] is not None:
            update_data[df.title.value] = node_dump['title']
        if 'tags' in node_dump and node_dump['tags'] is not None:
            update_data[df.tags.value] = json.dumps(node_dump['tags'])
        if 'position_x' in node_dump and node_dump['position_x'] is not None:
            update_data[df.position_x.value] = node_dump['position_x']
        if 'position_y' in node_dump and node_dump['position_y'] is not None:
            update_data[df.position_y.value] = node_dump['position_y']
        if 'custom_date' in node_dump and node_dump['custom_date'] is not None:
            update_data[df.custom_date.value] = node_dump['custom_date']
        
        logger.debug(f"update_node: Updating fields: {list(update_data.keys())}")
            
        db_response = supabase.table("nodes")\
            .update(update_data)\
            .eq(df.user_id.value, node_dump[df.user_id.value]) \
            .eq(df.node_id.value, node_dump[df.node_id.value]) \
            .execute()
        result = db_response.data[0] if db_response.data else None
        
        if result:
            # Convert tags back to list
            if 'tags' in result and result['tags']:
                try:
                    result['tags'] = json.loads(result['tags'])
                except:
                    result['tags'] = []
            
            # Load image data if image_id exists
            if result.get('image_id'):
                try:
                    image_record = supabase.table("images").select("file_path")\
                        .eq("image_id", result['image_id']).execute()
                    if image_record.data:
                        base64_data = image_record.data[0].get('file_path', '')
                        if base64_data and not base64_data.startswith('data:'):
                            result['image_data'] = f"data:image/jpeg;base64,{base64_data}"
                        else:
                            result['image_data'] = base64_data
                except Exception as e:
                    logger.error(f"Error loading image: {e}")
        
        return result
    
    def delete_node(self, payload: NodeInfoDelete):
        """Delete node and its associated data efficiently"""
        node_dump = payload.model_dump()
        user_id = node_dump['user_id']
        node_id = node_dump['node_id']
        
        try:
            # Get node info including image_id before deletion
            node_info = supabase.table("nodes").select("image_id")\
                .eq(df.user_id.value, user_id)\
                .eq(df.node_id.value, node_id)\
                .execute()
            
            image_id = node_info.data[0].get('image_id') if node_info.data else None
            
            # Delete node (nodelinks will cascade delete if FK constraint exists)
            supabase.table("nodes").delete()\
                .eq(df.user_id.value, user_id)\
                .eq(df.node_id.value, node_id)\
                .execute()
            
            # Delete associated image and links in parallel for speed
            if image_id:
                try:
                    supabase.table("images").delete().eq("image_id", image_id).execute()
                except Exception as e:
                    logger.warning(f"Image deletion failed (non-critical): {e}")
            
            # Clean up links (if no CASCADE)
            try:
                supabase.table("nodelinks").delete()\
                    .or_(f"source_node_id.eq.{node_id},target_node_id.eq.{node_id}")\
                    .execute()
            except Exception as e:
                logger.warning(f"Link deletion failed (non-critical): {e}")
            
            logger.info(f"Deleted node {node_id} with image {image_id}")
            return {"message": "Node deleted successfully"}
            
        except Exception as e:
            logger.error(f"Error deleting node {node_id}: {e}")
            raise
    
    def get_node_info(self, payload: NodeInfoDelete):
        node_dump = payload.model_dump()
        db_response = supabase.table("nodes").select("*")\
            .eq(df.user_id.value, node_dump['user_id'])\
            .eq(df.node_id.value, node_dump['node_id'])\
            .execute()
        result = db_response.data[0] if db_response.data else None
        
        if result:
            # Convert tags back to list
            if 'tags' in result and result['tags']:
                try:
                    result['tags'] = json.loads(result['tags'])
                except:
                    result['tags'] = []
            
            # Load image data if image_id exists
            if result.get('image_id'):
                try:
                    image_record = supabase.table("images").select("file_path")\
                        .eq("image_id", result['image_id']).execute()
                    if image_record.data:
                        base64_data = image_record.data[0].get('file_path', '')
                        if base64_data and not base64_data.startswith('data:'):
                            result['image_data'] = f"data:image/jpeg;base64,{base64_data}"
                        else:
                            result['image_data'] = base64_data
                except Exception as e:
                    logger.error(f"Error loading image: {e}")
        
        return result


node_service = NodeService()
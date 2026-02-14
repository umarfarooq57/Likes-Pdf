"""
Cleanup Tasks
Background tasks for system maintenance and cleanup
"""

import time
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, List

from celery import shared_task
from celery.utils.log import get_task_logger

from app.core.config import settings


logger = get_task_logger(__name__)


def update_progress(task, progress: int, step: str):
    """Update task progress"""
    task.update_state(
        state='PROGRESS',
        meta={'progress': progress, 'step': step}
    )


@shared_task(bind=True, name="cleanup.temp_files")
def cleanup_temp_files_task(
    self,
    max_age_hours: int = 24,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Clean up temporary files older than specified age"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Scanning temp directory")
        
        temp_dir = Path(settings.STORAGE_PATH) / "temp"
        if not temp_dir.exists():
            return {
                "status": "completed",
                "files_deleted": 0,
                "bytes_freed": 0,
                "message": "Temp directory does not exist",
            }
        
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        files_deleted = 0
        bytes_freed = 0
        errors = []
        
        update_progress(self, 30, "Deleting old files")
        
        for file_path in temp_dir.rglob("*"):
            if file_path.is_file():
                try:
                    mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                    if mtime < cutoff_time:
                        file_size = file_path.stat().st_size
                        file_path.unlink()
                        files_deleted += 1
                        bytes_freed += file_size
                except Exception as e:
                    errors.append(f"{file_path}: {str(e)}")
        
        # Also clean up empty directories
        update_progress(self, 70, "Cleaning empty directories")
        
        dirs_deleted = 0
        for dir_path in sorted(temp_dir.rglob("*"), reverse=True):
            if dir_path.is_dir():
                try:
                    if not any(dir_path.iterdir()):
                        dir_path.rmdir()
                        dirs_deleted += 1
                except Exception:
                    pass
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "files_deleted": files_deleted,
            "directories_deleted": dirs_deleted,
            "bytes_freed": bytes_freed,
            "bytes_freed_mb": round(bytes_freed / (1024 * 1024), 2),
            "errors": errors[:10] if errors else [],
            "error_count": len(errors),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Temp cleanup failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="cleanup.expired_documents")
def cleanup_expired_documents_task(
    self,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Clean up expired documents based on retention settings"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Querying expired documents")
        
        # This would need database access - placeholder implementation
        # In production, this would:
        # 1. Query documents where delete_at < now()
        # 2. Delete files from storage
        # 3. Update database records
        
        documents_deleted = 0
        bytes_freed = 0
        
        # Check processed directory for old files
        processed_dir = Path(settings.STORAGE_PATH) / "processed"
        if processed_dir.exists():
            # Default: delete processed files older than 7 days
            cutoff_time = datetime.now() - timedelta(days=7)
            
            update_progress(self, 50, "Cleaning processed files")
            
            for file_path in processed_dir.rglob("*"):
                if file_path.is_file():
                    try:
                        mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                        if mtime < cutoff_time:
                            file_size = file_path.stat().st_size
                            file_path.unlink()
                            documents_deleted += 1
                            bytes_freed += file_size
                    except Exception as e:
                        logger.warning(f"Could not delete {file_path}: {e}")
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "documents_deleted": documents_deleted,
            "bytes_freed": bytes_freed,
            "bytes_freed_mb": round(bytes_freed / (1024 * 1024), 2),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Document cleanup failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="cleanup.reset_daily_usage")
def reset_daily_usage_task(
    self,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Reset daily usage counters for all users"""
    start_time = time.time()
    
    try:
        update_progress(self, 20, "Resetting usage counters")
        
        # This would need database access - placeholder implementation
        # In production:
        # 1. Reset daily_conversion_count for all users
        # 2. Archive yesterday's usage stats
        # 3. Send usage summary emails if configured
        
        users_reset = 0
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "users_reset": users_reset,
            "reset_date": datetime.now().isoformat(),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Usage reset failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="cleanup.orphaned_files")
def cleanup_orphaned_files_task(
    self,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Find and remove files that exist in storage but not in database"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Scanning storage")
        
        storage_dir = Path(settings.STORAGE_PATH)
        orphaned_files = []
        bytes_freed = 0
        
        # This would need database access - placeholder implementation
        # In production:
        # 1. Get list of all files in storage
        # 2. Query database for all document file paths
        # 3. Delete files not in database
        
        # For now, just scan uploads folder for very old files
        uploads_dir = storage_dir / "uploads"
        if uploads_dir.exists():
            update_progress(self, 50, "Checking uploads")
            
            cutoff_time = datetime.now() - timedelta(days=30)
            
            for file_path in uploads_dir.rglob("*"):
                if file_path.is_file():
                    try:
                        mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                        if mtime < cutoff_time:
                            file_size = file_path.stat().st_size
                            orphaned_files.append({
                                "path": str(file_path),
                                "size": file_size,
                                "age_days": (datetime.now() - mtime).days,
                            })
                            file_path.unlink()
                            bytes_freed += file_size
                    except Exception:
                        pass
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "orphaned_files_found": len(orphaned_files),
            "bytes_freed": bytes_freed,
            "bytes_freed_mb": round(bytes_freed / (1024 * 1024), 2),
            "files": orphaned_files[:50],  # Limit to first 50
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Orphan cleanup failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="cleanup.old_logs")
def cleanup_old_logs_task(
    self,
    max_age_days: int = 90,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Clean up old log entries from database"""
    start_time = time.time()
    
    try:
        update_progress(self, 20, "Deleting old logs")
        
        # This would need database access - placeholder implementation
        # In production:
        # 1. DELETE FROM activity_logs WHERE created_at < cutoff
        # 2. DELETE FROM api_request_logs WHERE created_at < cutoff
        # 3. DELETE FROM error_logs WHERE created_at < cutoff
        # 4. Archive important logs to cold storage first
        
        logs_deleted = {
            "activity_logs": 0,
            "api_request_logs": 0,
            "error_logs": 0,
        }
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "logs_deleted": logs_deleted,
            "cutoff_date": (datetime.now() - timedelta(days=max_age_days)).isoformat(),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Log cleanup failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="cleanup.failed_jobs")
def cleanup_failed_jobs_task(
    self,
    max_age_days: int = 7,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Clean up old failed job records"""
    start_time = time.time()
    
    try:
        update_progress(self, 20, "Cleaning failed jobs")
        
        # This would need database access - placeholder implementation
        # In production:
        # 1. Query failed jobs older than max_age_days
        # 2. Archive job details if needed
        # 3. Delete job records
        # 4. Clean up any associated temp files
        
        jobs_cleaned = 0
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "jobs_cleaned": jobs_cleaned,
            "cutoff_date": (datetime.now() - timedelta(days=max_age_days)).isoformat(),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Job cleanup failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="cleanup.storage_report")
def generate_storage_report_task(
    self,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Generate storage usage report"""
    start_time = time.time()
    
    try:
        update_progress(self, 20, "Analyzing storage")
        
        storage_dir = Path(settings.STORAGE_PATH)
        
        report = {
            "directories": {},
            "total_files": 0,
            "total_size": 0,
        }
        
        for subdir in ["uploads", "processed", "temp"]:
            dir_path = storage_dir / subdir
            if dir_path.exists():
                file_count = 0
                total_size = 0
                oldest_file = None
                newest_file = None
                
                for file_path in dir_path.rglob("*"):
                    if file_path.is_file():
                        file_count += 1
                        stat = file_path.stat()
                        total_size += stat.st_size
                        
                        if oldest_file is None or stat.st_mtime < oldest_file:
                            oldest_file = stat.st_mtime
                        if newest_file is None or stat.st_mtime > newest_file:
                            newest_file = stat.st_mtime
                
                report["directories"][subdir] = {
                    "file_count": file_count,
                    "total_size": total_size,
                    "total_size_mb": round(total_size / (1024 * 1024), 2),
                    "oldest_file": datetime.fromtimestamp(oldest_file).isoformat() if oldest_file else None,
                    "newest_file": datetime.fromtimestamp(newest_file).isoformat() if newest_file else None,
                }
                
                report["total_files"] += file_count
                report["total_size"] += total_size
        
        report["total_size_mb"] = round(report["total_size"] / (1024 * 1024), 2)
        report["total_size_gb"] = round(report["total_size"] / (1024 * 1024 * 1024), 2)
        
        # Check disk space
        try:
            disk_usage = shutil.disk_usage(storage_dir)
            report["disk"] = {
                "total_gb": round(disk_usage.total / (1024 * 1024 * 1024), 2),
                "used_gb": round(disk_usage.used / (1024 * 1024 * 1024), 2),
                "free_gb": round(disk_usage.free / (1024 * 1024 * 1024), 2),
                "usage_percent": round((disk_usage.used / disk_usage.total) * 100, 1),
            }
        except Exception:
            report["disk"] = None
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        report["status"] = "completed"
        report["generated_at"] = datetime.now().isoformat()
        report["processing_time_ms"] = processing_time
        
        return report
        
    except Exception as e:
        logger.error(f"Storage report failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="cleanup.session_cleanup")
def cleanup_expired_sessions_task(
    self,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Clean up expired scan sessions and their files"""
    start_time = time.time()
    
    try:
        update_progress(self, 20, "Cleaning expired sessions")
        
        # This would need database access - placeholder implementation
        # In production:
        # 1. Query ScanSessions where expires_at < now()
        # 2. Delete associated ScanPages and files
        # 3. Delete session records
        
        sessions_cleaned = 0
        pages_cleaned = 0
        bytes_freed = 0
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "sessions_cleaned": sessions_cleaned,
            "pages_cleaned": pages_cleaned,
            "bytes_freed": bytes_freed,
            "bytes_freed_mb": round(bytes_freed / (1024 * 1024), 2),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Session cleanup failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }

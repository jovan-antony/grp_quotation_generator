"""
Network Storage Helper for accessing Windows SMB/CIFS shares from Docker
This allows the Python backend to write files directly to network shares
"""

from smb.SMBConnection import SMBConnection
from smb.smb_structs import OperationFailure
import os
import tempfile
from typing import Optional
import socket


class NetworkStorage:
    """Helper class to interact with Windows network shares"""
    
    def __init__(self, username: str, password: str, client_name: str = "docker_backend"):
        """
        Initialize network storage connection
        
        Args:
            username: Windows username with access to shares
            password: Windows password
            client_name: Client machine name (can be anything)
        """
        self.username = username
        self.password = password
        self.client_name = client_name
    
    def parse_network_path(self, network_path: str) -> tuple:
        """
        Parse network path into components
        
        Args:
            network_path: Path like //192.168.0.10/ShareName/Folder/file.docx
            
        Returns:
            (server_ip, share_name, remote_path, filename)
        """
        # Normalize path separators
        path = network_path.replace('\\', '/').strip('/')
        parts = path.split('/')
        
        if len(parts) < 3:
            raise ValueError(f"Invalid network path format: {network_path}")
        
        server_ip = parts[0]
        share_name = parts[1]
        
        # Remote path is everything after share name
        if len(parts) > 3:
            remote_path = '/'.join(parts[2:-1])  # Folders only
            filename = parts[-1]  # Last part is filename
        else:
            remote_path = ''
            filename = parts[2]
        
        return server_ip, share_name, remote_path, filename
    
    def connect(self, server_ip: str, server_name: Optional[str] = None, timeout: int = 30) -> SMBConnection:
        """
        Create SMB connection to server
        
        Args:
            server_ip: IP address of the SMB server
            server_name: NetBIOS name of server (optional, will use IP if not provided)
            timeout: Connection timeout in seconds
            
        Returns:
            SMBConnection object
        """
        if server_name is None:
            # Try to get hostname from IP
            try:
                server_name = socket.gethostbyaddr(server_ip)[0]
            except:
                server_name = server_ip
        
        conn = SMBConnection(
            self.username,
            self.password,
            self.client_name,
            server_name,
            use_ntlm_v2=True
        )
        
        # Connect to server
        if not conn.connect(server_ip, 445, timeout=timeout):
            raise ConnectionError(f"Failed to connect to {server_ip}")
        
        return conn
    
    def save_file(self, local_file_path: str, network_path: str, create_dirs: bool = True) -> bool:
        """
        Save local file to network share
        
        Args:
            local_file_path: Path to local file to upload
            network_path: Destination network path (//server/share/folder/file.docx)
            create_dirs: Whether to create directories if they don't exist
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Parse network path
            server_ip, share_name, remote_path, filename = self.parse_network_path(network_path)
            
            # Connect to server
            conn = self.connect(server_ip)
            
            # Create directories if needed
            if create_dirs and remote_path:
                self._create_directories(conn, share_name, remote_path)
            
            # Construct full remote path
            full_remote_path = f"{remote_path}/{filename}" if remote_path else filename
            
            # Upload file
            with open(local_file_path, 'rb') as f:
                bytes_uploaded = conn.storeFile(share_name, full_remote_path, f)
            
            conn.close()
            
            print(f"✓ Successfully uploaded {local_file_path} to {network_path}")
            print(f"  Bytes uploaded: {bytes_uploaded}")
            return True
            
        except FileNotFoundError:
            print(f"❌ Local file not found: {local_file_path}")
            return False
        except OperationFailure as e:
            print(f"❌ SMB operation failed: {e}")
            return False
        except Exception as e:
            print(f"❌ Error saving file to network share: {e}")
            return False
    
    def _create_directories(self, conn: SMBConnection, share_name: str, path: str):
        """
        Recursively create directories on network share
        
        Args:
            conn: Active SMB connection
            share_name: Share name
            path: Directory path to create
        """
        if not path:
            return
        
        parts = path.split('/')
        current_path = ''
        
        for part in parts:
            current_path = f"{current_path}/{part}" if current_path else part
            
            try:
                # Try to create directory
                conn.createDirectory(share_name, current_path)
                print(f"  Created directory: {current_path}")
            except OperationFailure:
                # Directory might already exist, that's fine
                pass
    
    def file_exists(self, network_path: str) -> bool:
        """
        Check if file exists on network share
        
        Args:
            network_path: Full network path to file
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            server_ip, share_name, remote_path, filename = self.parse_network_path(network_path)
            conn = self.connect(server_ip)
            
            full_remote_path = f"{remote_path}/{filename}" if remote_path else filename
            
            # Try to get file attributes
            conn.getAttributes(share_name, full_remote_path)
            conn.close()
            return True
            
        except:
            return False
    
    def delete_file(self, network_path: str) -> bool:
        """
        Delete file from network share
        
        Args:
            network_path: Full network path to file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            server_ip, share_name, remote_path, filename = self.parse_network_path(network_path)
            conn = self.connect(server_ip)
            
            full_remote_path = f"{remote_path}/{filename}" if remote_path else filename
            
            conn.deleteFiles(share_name, full_remote_path)
            conn.close()
            
            print(f"✓ Deleted file: {network_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting file: {e}")
            return False
    
    def list_directory(self, network_path: str) -> list:
        """
        List files in network directory
        
        Args:
            network_path: Path to directory (//server/share/folder/)
            
        Returns:
            List of filenames
        """
        try:
            server_ip, share_name, remote_path, _ = self.parse_network_path(network_path + "/dummy")
            conn = self.connect(server_ip)
            
            files = conn.listPath(share_name, remote_path or '/')
            filenames = [f.filename for f in files if f.filename not in ['.', '..']]
            
            conn.close()
            return filenames
            
        except Exception as e:
            print(f"❌ Error listing directory: {e}")
            return []


# Example usage
if __name__ == "__main__":
    # Test the network storage class
    storage = NetworkStorage(
        username=os.getenv("SMB_USERNAME", "smbgrp"),
        password=os.getenv("SMB_PASSWORD", "smbgrp")
    )
    
    # Test file operations
    test_path = "//192.168.0.10/GRP-Quotations/test.txt"
    
    # Create a temp file
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
        f.write("Test file content")
        temp_file = f.name
    
    # Upload to network share
    if storage.save_file(temp_file, test_path):
        print("✓ File upload successful")
        
        # Check if exists
        if storage.file_exists(test_path):
            print("✓ File exists on network share")
        
        # Delete test file
        storage.delete_file(test_path)
    
    # Clean up local temp file
    os.unlink(temp_file)

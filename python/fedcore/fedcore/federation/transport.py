import flwr as fl
from loguru import logger

class TransportConfigurator:
    """
    Manages transport settings for the Flower server and client runtime.
    """
    
    @staticmethod
    def get_grpc_server_options() -> list:
        max_message_length = 100 * 1024 * 1024
        return [
            ("grpc.max_receive_message_length", max_message_length),
            ("grpc.max_send_message_length", max_message_length),
        ]
        
    @staticmethod
    def get_grpc_client_options() -> list:
        max_message_length = 100 * 1024 * 1024
        return [
            ("grpc.max_receive_message_length", max_message_length),
            ("grpc.max_send_message_length", max_message_length),
        ]

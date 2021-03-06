from app import siem_log_name
import logging
import ujson
import datetime
mythic_siem_logger = None


if siem_log_name != "":
    mythic_siem_logger = logging.getLogger('mythic')
    mythic_siem_logger.setLevel(logging.DEBUG)
    file_handler = logging.FileHandler(siem_log_name)
    file_handler.setFormatter(logging.Formatter('%(message)s'))
    mythic_siem_logger.addHandler(file_handler)


async def log_to_siem(mythic_object, mythic_source: str):
    if mythic_siem_logger is not None:
        if type(mythic_object).__name__ in ["Callback"]:
            message = mythic_object.to_json(False)
        else:
            message = mythic_object.to_json()
        log_msg = {
            "timestamp": datetime.datetime.utcnow().strftime("%m/%d/%Y %H:%M:%S"),
            "mythic_object": mythic_source,
            "message": message
        }
        mythic_siem_logger.debug(ujson.dumps(log_msg))

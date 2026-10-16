from collections import deque
from threading import Condition
from uuid import uuid4
import time


class EventRelay:
    def __init__(self, capacity=512):
        self.events = deque(maxlen=capacity)
        self.condition = Condition()
        self.epoch = uuid4().hex
        self.sequence = 0

    def publish(self, message):
        with self.condition:
            for sequence, existing in self.events:
                if (existing['clientId'], existing['id']) == (message['clientId'], message['id']):
                    return f'{self.epoch}:{sequence}'
            self.sequence += 1
            self.events.append((self.sequence, message))
            self.condition.notify_all()
            return f'{self.epoch}:{self.sequence}'

    def poll(self, cursor=None, timeout=20):
        deadline = time.monotonic() + timeout
        with self.condition:
            try:
                epoch, number = cursor.split(':')
                after = int(number)
            except (AttributeError, ValueError):
                epoch, after = None, -1
            while True:
                oldest = self.events[0][0] if self.events else self.sequence + 1
                reset = epoch != self.epoch or after < oldest - 1 or after > self.sequence
                if reset:
                    return {'cursor': f'{self.epoch}:{self.sequence}', 'reset': True, 'events': []}
                events = [message for sequence, message in self.events if sequence > after]
                remaining = deadline - time.monotonic()
                if events or remaining <= 0:
                    return {'cursor': f'{self.epoch}:{self.sequence}', 'reset': False, 'events': events}
                self.condition.wait(remaining)

# Устанавливаем базовый образ
FROM python:3.8-slim

# Устанавливаем переменную окружения для удобства
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Создаем директорию приложения в контейнере
RUN mkdir /app

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем зависимости
COPY requirements.txt /app/

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем все файлы в контейнер
COPY . .

# Определяем команду, которая будет запущена при старте контейнера
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0"]
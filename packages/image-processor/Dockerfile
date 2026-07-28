FROM rust:1.97-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config nasm && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./

RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

COPY src ./src

RUN touch src/main.rs && cargo build --release

FROM gcr.io/distroless/cc-debian12

COPY --from=builder /app/target/release/image-processor /

EXPOSE 8080

CMD ["/image-processor"]

export interface IAsyncDisposableEnd<T = void> extends AsyncDisposable {
  end(): Promise<T>;
}
# Effect Router (WT)

A typesafe, [Effect](https://effect.website)-based router for React applications.

> [!WARN]
> This project is in early stage of planning and development and not ready to use in production yet.

Effect Router is heavily inspired by the awesome [TanStack Router](https://tanstack.com/router/latest) and expands the primitives with an end-to-end Effect based system. This way, Effect Router combines the power of two beasts in the React and TypeScript ecosystem:

- **TanStack Router**: A highly flexible and typesafe router for React, designed for complex routing scenarios. It provides advanced features like nested routes, data loading, and route-based code splitting, all with a strong focus on type safety and developer experience.
- **Effect**: A powerful library for managing effects, resources, and concurrency in TypeScript applications. It enables robust error handling, resource management, and declarative effect composition, making complex asynchronous workflows predictable and maintainable.

By integrating TanStack Router's advanced routing capabilities with Effect's robust effect management, Effect Router enables:

- **End-to-end type safety**: Ensures that route parameters, loaders, and actions are all type-checked, reducing runtime errors.
- **Declarative data loading and side effects**: Use Effect to manage data fetching, caching, and side effects directly within your routing logic.
- **Consistent error and resource management**: Handle errors, cancellations, dependency injection, and resource cleanup in a unified way across your entire app.
- **Seamless integration**: Build complex, scalable React applications with predictable routing and effectful logic from the front end to the back end.
- **Built-in support for observability**: Leverage Effect's observability features to monitor and debug routing and data loading operations effectively.
- **Composable and modular architecture**: Create reusable route components and loaders that can be easily shared across your application.

This combination empowers developers to create super powerful, maintainable, and reliable routers for React apps, leveraging the strengths of both libraries for a best-in-class developer experience.

Effect Router is built from scratch to provide a deep integration with both technologies, ensuring a robust library that meets the needs of modern React applications.

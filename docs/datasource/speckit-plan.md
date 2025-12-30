# SpecKit Plan: Data Source Integration

> 说明：如果你要做“Superset 风格优先”的组件字段选择/映射 + 动态属性面板（而不仅是数据源接入本身），请直接参考：
> - docs/superset-style/commands.md
> - docs/superset-style/speckit-specify.md
> - docs/superset-style/speckit-plan.md
> - docs/superset-style/speckit-tasks.md
> - docs/superset-style/speckit-implement.md

/speckit.specify
Build a "Multi-type Data Source Integration" feature for the thingsvis visualization project.
The system must support fetching and displaying data from various sources including REST APIs, Real-time streams (WebSocket/MQTT), and Databases (via API proxies).
It should also support a "Static JSON" mode for mocking and prototyping without a backend.

Key Requirements:
1.  **Data Source Management**: A global registry to configure and manage data connections (e.g., "Production DB", "IoT MQTT Broker").
2.  **Component Binding**: Visual components must be able to bind to these data sources via configuration, not hardcoding.
3.  **Real-time Support**: Handle real-time data updates efficiently.
4.  **Asset Binding**: Built-in assets (Images, Text, Shapes) must support dynamic property binding using expressions (e.g., `{{ query.data.value }}`).
5.  **Developer Experience**: Provide a "Static JSON" mode for easy mocking and a transformation layer (JS sandbox) to adapt data formats.

/speckit.plan
The implementation follows a **Kernel-UI Separation** architecture to ensure scalability and maintainability within the React ecosystem.

**Architecture & Tech Stack:**
*   **Kernel Layer (`@thingsvis/kernel`)**:
    *   Responsible for logic, configuration management, and adapter registration.
    *   **`DataSourceManager`**: Manages the lifecycle of data source instances.
    *   **Adapters**: Implements `IDataSourceAdapter` for specific protocols (REST, MQTT, Static JSON).
    *   **Schema**: Uses `zod` to define `DataSourceSchema` and extend `NodeSchema` with `data` binding fields.
*   **UI Layer (`@thingsvis/ui` & `apps/studio`)**:
    *   Responsible for state management, data fetching, and side effects.
    *   **React Query (TanStack Query)**: Manages async data state (caching, loading, error handling, refetching).
    *   **`useDataSource` Hook**: The bridge between components and the Kernel adapters.
    *   **`DataContainer`**: A Higher-Order Component (HOC) that wraps visual components to inject data.
*   **Expression Engine**: A lightweight parser to evaluate `{{ }}` bindings for basic asset properties.

**Data Flow:**
1.  User configures a Data Source (Global).
2.  User binds a Component to a Source + Query (e.g., API Path) + Transform Script.
3.  `DataContainer` reads schema -> calls `useDataSource`.
4.  `useDataSource` calls Kernel Adapter -> returns data -> React Query caches it.
5.  Data is injected into the Component's `props`.

/speckit.tasks
- [ ] **Schema Definition**: Update `@thingsvis/schema` to include `DataSourceSchema` and extend `NodeSchema` with `DataBindingSchema`.
- [ ] **Kernel Core**: Implement `DataSourceManager` and `IDataSourceAdapter` interface in `@thingsvis/kernel`.
- [ ] **Adapters**: Implement `StaticJsonAdapter` (for mocking) and `RestApiAdapter` (using `fetch`).
- [ ] **UI Hooks**: Create `DataSourceProvider` context and `useDataSource` hook in `@thingsvis/ui` using React Query.
- [ ] **Runtime Wrapper**: Create `DataContainer` component to wrap visual components and handle data injection.
- [ ] **Studio UI - Global**: Create a "Data Sources" panel in `apps/studio` to list, add, and edit global data sources.
- [ ] **Studio UI - Props**: Update `PropsPanel` to add a "Data" tab with Source selection, Query input, and Transform script editor.
- [ ] **Expression Engine**: Implement a basic expression parser for `{{ }}` syntax to support dynamic properties on basic assets (Text, Image).
- [ ] **Integration**: Verify the end-to-end flow from configuring a Static JSON source to rendering a chart.

/speckit.implement

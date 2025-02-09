# Daphne

[![Backend Tests](https://github.com/DaphneWebFramework/Daphne/actions/workflows/test-backend.yml/badge.svg)](https://github.com/DaphneWebFramework/Daphne/actions/workflows/test-backend.yml)
[![Test Frontend](https://github.com/DaphneWebFramework/Daphne/actions/workflows/test-frontend.yml/badge.svg)](https://github.com/DaphneWebFramework/Daphne/actions/workflows/test-frontend.yml)

![](assets/masthead.png)

> <sub><sup>Daphne, a naiad nymph transformed into a laurel tree to escape Apollo, represents transformation and purity.</sup></sub>

## Overview

**Daphne** is a full-stack web framework designed for building database-driven web applications effortlessly. It is based on PHP, MySQL, Apache, jQuery, and Bootstrap.

## Installation

### Cloning the Repository

To clone Daphne along with its submodules:

```
git clone --recurse-submodules https://github.com/DaphneWebFramework/Daphne.git
```

### Updating Submodules

Daphne manages certain libraries and dependencies as separate Git submodules to keep them modular and independently maintainable. To update all submodules to their latest versions:

```
git submodule update --remote --merge
```

### Staying Up to Date

Daphne is a template repository. If you create a project from this template, updates to Daphne **will not** automatically flow into your derived repository. To incorporate new features and fixes:

- **Manual Approach:** Copy or merge changes from Daphne into your derived codebase whenever needed.
- **Advanced Git Techniques:** Use practices like adding the Daphne repo as a second remote, allowing you to pull and merge upstream changes. This may involve additional steps and conflict resolution if your codebase has diverged.

## License

This project is distributed under the Creative Commons Attribution 4.0 International License. For more information, visit [CC BY 4.0 License](https://creativecommons.org/licenses/by/4.0/).

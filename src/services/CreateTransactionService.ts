import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid.');
    }
    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();
      if (total < value) {
        throw new AppError('You do not have enough balance.');
      }
    }

    const checkCategoryExists = await categoriesRepository.findOne({
      where: { category },
    });

    let category_id: string;

    if (!checkCategoryExists) {
      const createdCategory = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(createdCategory);
      category_id = createdCategory.id;
    } else {
      category_id = checkCategoryExists.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

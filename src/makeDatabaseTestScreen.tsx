import {
  Gap,
  ScreenView,
  ScrollView,
  StyledButton,
  StyledLoader,
  StyledText,
  StyledView,
  SwitchButton,
} from "@dwidge/components-rnw";
import {
  ApiFilterObject,
  ApiHooks,
  ApiItem3,
  ApiRecord,
} from "@dwidge/crud-api-react";
import { useNav } from "@dwidge/hooks-expo";
import { AsyncState, getActionValue } from "@dwidge/hooks-react";
import { getTimeDifferenceString } from "@dwidge/utils-js";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, ListRenderItem } from "react-native";
import { StyledHeader } from "./StyledHeader.js";

export const makeDatabaseTestScreen = <T extends ApiRecord & ApiItem3>({
  title = "TestItem",
  useApi = () => ({}) as ApiHooks<T>,
  useNavAction = () => (filter: Partial<T>) => {},
  useNavFilter = () => ({}) as ApiFilterObject<T>,
  randItem = () => ({}) as Partial<T>,
} = {}) => {
  const DeleteRestoreButton = ({ api = useApi(), item = api.useItem() }) => {
    const deleteItem = api.useDeleteItem();
    const restoreItem = api.useRestoreItem();

    const isDeleted = item.deletedAt !== null;
    const buttonText = isDeleted ? "Restore" : "Delete";
    const buttonAction = isDeleted
      ? restoreItem && (() => restoreItem(item))
      : deleteItem && (() => deleteItem(item));

    return (
      <StyledButton onPress={buttonAction} disabled={!buttonAction}>
        {buttonText}
      </StyledButton>
    );
  };

  const ListScreen = ({}) => (
    <ScreenView>
      <StyledHeader title={title} />
      <StyledView pad gap flex>
        <StyledText l>{useApi().useCount()}</StyledText>
        <ListView />
      </StyledView>
    </ScreenView>
  );

  const ItemScreen = ({ filter = useNavFilter() }) => (
    <ScreenView>
      <ScrollView>
        <StyledHeader title={title} />
        <StyledView pad gap>
          <ItemView />
        </StyledView>
      </ScrollView>
    </ScreenView>
  );

  const ListView = () => {
    const api = useApi();
    const onPressItem = useNavAction();
    const createItem = api.useCreateItem();
    const navFilter = useNavFilter();

    const [data, setData] = useState<T[]>([]);
    const [page, setPage] = useState(0);
    const itemsPerPage = 200;

    const { deleted: deletedParam } = useLocalSearchParams();
    const showDeleted = deletedParam === "true";
    const nav = useNav();

    const toggleDeleted = useCallback(
      (newValue: "Existing" | "Deleted") => {
        const newShowDeleted = newValue === "Deleted";
        nav(".", newShowDeleted ? { deleted: "true" } : { deleted: undefined });
      },
      [nav],
    );

    const showDeletedAsyncState: AsyncState<"Existing" | "Deleted"> = [
      showDeleted ? "Deleted" : "Existing",
      async (getValue) => {
        const newValue = await getActionValue<"Existing" | "Deleted">(
          getValue,
          showDeleted ? "Deleted" : "Existing",
        );
        toggleDeleted(newValue);
        return newValue;
      },
    ];

    const list = api.useGetList(
      { ...navFilter, deletedAt: showDeleted ? { $not: null } : null },
      {
        limit: itemsPerPage,
        offset: page * itemsPerPage,
        order: [showDeleted ? ["deletedAt", "DESC"] : ["updatedAt", "DESC"]],
        columns: ["id", "deletedAt", "updatedAt"],
      },
    );

    const hasMore = list !== undefined && list.length === itemsPerPage;
    const loading = list === undefined;

    useEffect(() => {
      if (list && page === 0) {
        setData(list as T[]);
      } else if (
        list &&
        page > 0 &&
        data[data.length - 1] !== list[list.length - 1]
      ) {
        setData((prevData) => [...prevData, ...list] as T[]);
      }
    }, [list, data, page]);

    const fetchMoreData = useCallback(() => {
      if (!loading && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    }, [loading, hasMore, page]);

    const renderItem: ListRenderItem<T> = useCallback(
      ({ item }) => (
        <StyledView key={"" + item.id} row gap>
          <StyledText onPress={() => onPressItem(item)} numberOfLines={1}>
            {item.id}
          </StyledText>
          <Gap flex />
          <StyledText flex numberOfLines={1} right>
            {getTimeDifferenceString(item.updatedAt)}
          </StyledText>
          <DeleteRestoreButton api={api} item={item} />
        </StyledView>
      ),
      [onPressItem, showDeleted],
    );

    const keyExtractor = useCallback((item: T) => "" + item.id, []);

    const renderFooter = useCallback(() => {
      if (loading && page > 0) {
        // Show loader only when fetching more
        return (
          <StyledView style={{ paddingVertical: 20 }}>
            <StyledLoader />
          </StyledView>
        );
      }
      return null;
    }, [loading, page]);

    const handleRefresh = useCallback(() => {
      setPage(0);
      setData([]); // Clear existing data while refreshing
    }, []);

    return (
      <StyledView gap flex>
        <SwitchButton
          options={["Existing", "Deleted"]}
          value={showDeletedAsyncState}
        />
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={fetchMoreData}
          onEndReachedThreshold={0.5} // Adjust as needed
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() =>
            loading ? null : <StyledText>No items found.</StyledText>
          }
          refreshing={loading && page === 0} // Only refreshing on initial load
          onRefresh={handleRefresh}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 5 }}
        />
        <StyledButton
          onPress={createItem ? () => createItem(randItem()) : undefined}
        >
          Add
        </StyledButton>
      </StyledView>
    );
  };

  const ItemView = ({
    item: [item, setItem] = useApi().useItem(
      {
        ...(useNavFilter() as Partial<T>),
      },
      { columns: ["deletedAt"] },
    ),
  }) =>
    item ? (
      <StyledView gap>
        <StyledText numberOfLines={111}>
          {JSON.stringify(item, null, 2)}
        </StyledText>
        <StyledView row gap>
          <StyledButton onPress={setItem && (() => setItem(randItem()))}>
            Random
          </StyledButton>
          <DeleteRestoreButton item={item} />
        </StyledView>
      </StyledView>
    ) : (
      <StyledText>Not Found</StyledText>
    );

  return { ListScreen, ItemScreen };
};
